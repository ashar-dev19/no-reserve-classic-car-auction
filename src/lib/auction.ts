import { db, now } from "./db";
import { publish } from "./events";
import { increment, nextMinimumBid } from "./increments";
import type { Bid, BidRow, Lot, LotView } from "./types";

export { increment, nextMinimumBid };

/** Bids extend the clock when they land inside this window before close. */
export const SOFT_CLOSE_WINDOW_MS = 2 * 60_000;
/** How far a soft-close bid pushes the clock out. */
export const SOFT_CLOSE_EXTENSION_MS = 2 * 60_000;

/* ── Reads ──────────────────────────────────────────────────── */

type LotRow = Lot & { auction_slug?: string; auction_title?: string };

function hydrate(row: LotRow): LotView {
  const high = db
    .prepare(
      `SELECT b.user_id, u.name
         FROM bids b JOIN users u ON u.id = b.user_id
        WHERE b.lot_id = ?
        ORDER BY b.amount DESC, b.is_auto DESC, b.created_at ASC, b.id ASC
        LIMIT 1`,
    )
    .get(row.id) as { user_id: number; name: string } | undefined;

  return {
    ...row,
    highlights: safeJson(row.highlights),
    flaws: safeJson(row.flaws),
    images: safeJson(row.images),
    reserve_met: !row.has_reserve || (row.reserve != null && row.current_bid >= row.reserve),
    high_bidder_id: high?.user_id ?? null,
    high_bidder_name: high?.name ?? null,
  };
}

function safeJson(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const LOT_SELECT = `
  SELECT l.*, a.slug AS auction_slug, a.title AS auction_title
    FROM lots l JOIN auctions a ON a.id = l.auction_id`;

export function getLotBySlug(slug: string): LotView | null {
  const row = db.prepare(`${LOT_SELECT} WHERE l.slug = ?`).get(slug) as LotRow | undefined;
  return row ? hydrate(row) : null;
}

export function getLotById(id: number): LotView | null {
  const row = db.prepare(`${LOT_SELECT} WHERE l.id = ?`).get(id) as LotRow | undefined;
  return row ? hydrate(row) : null;
}

export interface LotQuery {
  auctionSlug?: string;
  status?: string;
  category?: string;
  make?: string;
  search?: string;
  featured?: boolean;
  noReserve?: boolean;
  sort?: "ending" | "newest" | "price_desc" | "price_asc" | "bids";
  limit?: number;
  offset?: number;
}

export function listLots(q: LotQuery = {}): LotView[] {
  const where: string[] = [];
  const params: unknown[] = [];

  if (q.auctionSlug) {
    where.push("a.slug = ?");
    params.push(q.auctionSlug);
  }
  if (q.status && q.status !== "all") {
    if (q.status === "open") where.push("l.status IN ('live','scheduled')");
    else if (q.status === "closed") where.push("l.status IN ('sold','unsold')");
    else {
      where.push("l.status = ?");
      params.push(q.status);
    }
  } else {
    where.push("l.status != 'draft'");
  }
  if (q.category) {
    where.push("l.category = ?");
    params.push(q.category);
  }
  if (q.make) {
    where.push("l.make = ?");
    params.push(q.make);
  }
  if (q.featured) where.push("l.featured = 1");
  if (q.noReserve) where.push("l.has_reserve = 0");
  if (q.search) {
    where.push("(l.title LIKE ? OR l.make LIKE ? OR l.model LIKE ? OR l.summary LIKE ?)");
    const like = `%${q.search}%`;
    params.push(like, like, like, like);
  }

  const order =
    q.sort === "newest"
      ? "l.created_at DESC"
      : q.sort === "price_desc"
        ? "l.current_bid DESC"
        : q.sort === "price_asc"
          ? "l.current_bid ASC"
          : q.sort === "bids"
            ? "l.bid_count DESC"
            : // "ending" — open lots by soonest close, then settled lots
              "CASE WHEN l.status IN ('live','scheduled') THEN 0 ELSE 1 END, l.ends_at ASC";

  const sql = `${LOT_SELECT}
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY ${order}
    LIMIT ? OFFSET ?`;

  const rows = db.prepare(sql).all(...params, q.limit ?? 48, q.offset ?? 0) as LotRow[];
  return rows.map(hydrate);
}

export function countLots(q: LotQuery = {}): number {
  const all = listLots({ ...q, limit: 10_000, offset: 0 });
  return all.length;
}

export function getBids(lotId: number, limit = 100): BidRow[] {
  return db
    .prepare(
      `SELECT b.*, u.name AS bidder_name, u.paddle_no
         FROM bids b JOIN users u ON u.id = b.user_id
        WHERE b.lot_id = ?
        ORDER BY b.created_at DESC, b.id DESC
        LIMIT ?`,
    )
    .all(lotId, limit) as BidRow[];
}

/* ── Bidding ────────────────────────────────────────────────── */

export type BidOutcome =
  | {
      ok: true;
      status: "leading" | "outbid" | "max_raised";
      lot: LotView;
      message: string;
      extended: boolean;
    }
  | { ok: false; error: string };

interface PlaceBidInput {
  lotId: number;
  userId: number;
  /** The bidder's ceiling, in cents. The engine only ever reveals what it must. */
  maxAmount: number;
}

/**
 * Proxy ("automatic") bidding, the model eBay and Bring a Trailer both use.
 * A bidder names a ceiling; the engine bids on their behalf one increment above
 * the next-highest ceiling, so the visible price reflects competition rather
 * than the winner's whole hand.
 */
export function placeBid({ lotId, userId, maxAmount }: PlaceBidInput): BidOutcome {
  const run = db.transaction((): BidOutcome => {
    const lot = db.prepare(`SELECT * FROM lots WHERE id = ?`).get(lotId) as Lot | undefined;
    if (!lot) return { ok: false, error: "Lot not found." };

    const ts = now();
    if (lot.status === "sold" || lot.status === "unsold" || ts >= lot.ends_at)
      return { ok: false, error: "Bidding on this lot has closed." };
    if (lot.status === "draft") return { ok: false, error: "This lot is not open for bidding." };
    if (ts < lot.starts_at) return { ok: false, error: "Bidding has not opened on this lot yet." };

    const user = db
      .prepare(`SELECT id, name, bidder_status, bid_limit FROM users WHERE id = ?`)
      .get(userId) as
      | { id: number; name: string; bidder_status: string; bid_limit: number }
      | undefined;
    if (!user) return { ok: false, error: "Account not found." };
    if (user.bidder_status === "suspended")
      return { ok: false, error: "Your bidding privileges are suspended. Contact the auction office." };
    if (user.bidder_status !== "approved")
      return {
        ok: false,
        error: "Your bidder registration is still under review. You'll be notified once approved.",
      };
    if (user.bid_limit > 0 && maxAmount > user.bid_limit)
      return {
        ok: false,
        error: `Your approved bid limit is ${(user.bid_limit / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}. Request an increase to bid higher.`,
      };

    const leader = db
      .prepare(
        `SELECT * FROM bids WHERE lot_id = ?
          ORDER BY amount DESC, is_auto DESC, created_at ASC, id ASC LIMIT 1`,
      )
      .get(lotId) as Bid | undefined;

    const minimum = leader ? lot.current_bid + increment(lot.current_bid) : lot.starting_bid;

    // The one case where a bid below the current minimum is legitimate: the
    // standing high bidder topping up their own ceiling.
    const isLeader = leader?.user_id === userId;

    if (!isLeader && maxAmount < minimum)
      return {
        ok: false,
        error: `Minimum bid is ${(minimum / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}.`,
      };

    if (isLeader && maxAmount <= leader!.max_amount)
      return {
        ok: false,
        error: "Your maximum bid is already at or above that amount.",
      };

    let newCurrent = lot.current_bid;
    let outcome: "leading" | "outbid" | "max_raised" = "leading";
    let outbidUserId: number | null = null;
    const inserts: Array<{ user_id: number; amount: number; max_amount: number; is_auto: number }> =
      [];

    const hasReserve = lot.has_reserve === 1 && lot.reserve != null;
    const reserve = lot.reserve ?? 0;

    /**
     * Lifts the price to the reserve when the ceiling standing behind it can
     * cover the reserve. Without this a lot with one bidder willing to pay well
     * over the reserve would still go unsold, because proxy bidding only ever
     * raises the price as far as the competition forces it.
     */
    const applyReserve = (price: number, standingCeiling: number) =>
      hasReserve && standingCeiling >= reserve && price < reserve ? reserve : price;

    if (!leader) {
      newCurrent = applyReserve(Math.min(maxAmount, lot.starting_bid), maxAmount);
      inserts.push({ user_id: userId, amount: newCurrent, max_amount: maxAmount, is_auto: 0 });
      outcome = "leading";
    } else if (isLeader) {
      // Raising your own ceiling moves no money and reveals nothing — unless it
      // newly covers the reserve, which the price must then reflect.
      db.prepare(`UPDATE bids SET max_amount = ? WHERE id = ?`).run(maxAmount, leader.id);
      const lifted = applyReserve(lot.current_bid, maxAmount);
      if (lifted > lot.current_bid) {
        newCurrent = lifted;
        inserts.push({ user_id: userId, amount: newCurrent, max_amount: maxAmount, is_auto: 1 });
      }
      outcome = "max_raised";
    } else if (maxAmount > leader.max_amount) {
      // Challenger wins the duel; price settles one step over the old ceiling.
      const step = increment(leader.max_amount);
      // Show the defeated proxy fighting up to its ceiling before it gives way.
      if (leader.max_amount > lot.current_bid)
        inserts.push({
          user_id: leader.user_id,
          amount: leader.max_amount,
          max_amount: leader.max_amount,
          is_auto: 1,
        });
      newCurrent = applyReserve(Math.min(maxAmount, leader.max_amount + step), maxAmount);
      inserts.push({ user_id: userId, amount: newCurrent, max_amount: maxAmount, is_auto: 0 });
      outcome = "leading";
      outbidUserId = leader.user_id;
    } else {
      // Standing proxy holds. The challenger's bid is recorded and immediately
      // answered, so the price rises but the leader does not change.
      inserts.push({ user_id: userId, amount: maxAmount, max_amount: maxAmount, is_auto: 0 });
      const step = increment(maxAmount);
      newCurrent = applyReserve(
        Math.min(leader.max_amount, maxAmount + step),
        leader.max_amount,
      );
      inserts.push({
        user_id: leader.user_id,
        amount: newCurrent,
        max_amount: leader.max_amount,
        is_auto: 1,
      });
      outcome = "outbid";
    }

    const insertBid = db.prepare(
      `INSERT INTO bids (lot_id, user_id, amount, max_amount, is_auto, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    inserts.forEach((b, i) =>
      insertBid.run(lotId, b.user_id, b.amount, b.max_amount, b.is_auto, ts + i),
    );

    // Soft close: a late bid buys everyone else a fresh window, which is what
    // stops sniping from deciding the lot.
    let endsAt = lot.ends_at;
    let extended = false;
    if (inserts.length > 0 && endsAt - ts < SOFT_CLOSE_WINDOW_MS) {
      endsAt = ts + SOFT_CLOSE_EXTENSION_MS;
      extended = true;
    }

    const bidCount = lot.bid_count + inserts.length;
    db.prepare(
      `UPDATE lots SET current_bid = ?, bid_count = ?, ends_at = ?, status = 'live' WHERE id = ?`,
    ).run(newCurrent, bidCount, endsAt, lotId);

    if (outbidUserId != null) {
      notify(outbidUserId, {
        type: "outbid",
        title: `Outbid on Lot ${lot.lot_no}`,
        body: `${lot.title} — the bid is now ${fmt(newCurrent)}.`,
        link: `/lots/${lot.slug}`,
      });
    }
    if (outcome === "outbid") {
      notify(userId, {
        type: "outbid",
        title: `Outbid on Lot ${lot.lot_no}`,
        body: `A standing maximum bid topped yours. The bid is now ${fmt(newCurrent)}.`,
        link: `/lots/${lot.slug}`,
      });
    }

    const fresh = getLotById(lotId)!;

    publish({
      type: "bid",
      lotId,
      lotSlug: lot.slug,
      currentBid: newCurrent,
      bidCount,
      endsAt,
      extended,
      reserveMet: fresh.reserve_met,
      highBidderId: fresh.high_bidder_id ?? userId,
      highBidderName: fresh.high_bidder_name ?? user.name,
      at: ts,
    });

    const message =
      outcome === "max_raised"
        ? "Maximum bid raised. You are still the high bidder."
        : outcome === "leading"
          ? `You are the high bidder at ${fmt(newCurrent)}.`
          : `Outbid — a standing maximum bid already exceeded yours. The bid is now ${fmt(newCurrent)}.`;

    return { ok: true, status: outcome, lot: fresh, message, extended };
  });

  try {
    return run();
  } catch (err) {
    console.error("[placeBid]", err);
    return { ok: false, error: "Could not record that bid. Please try again." };
  }
}

function fmt(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function notify(
  userId: number,
  n: { type: string; title: string; body?: string; link?: string },
): void {
  db.prepare(
    `INSERT INTO notifications (user_id, type, title, body, link, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(userId, n.type, n.title, n.body ?? null, n.link ?? null, now());
}

/* ── Clock: open and settle lots ────────────────────────────── */

/**
 * Advances every lot and auction whose clock has run out. Idempotent and cheap,
 * so it is safe to call on page loads as well as from the live-stream ticker —
 * there is no separate worker to keep alive.
 */
export function sweep(): { opened: number; closed: number } {
  const ts = now();
  let opened = 0;
  let closed = 0;

  const toOpen = db
    .prepare(`SELECT * FROM lots WHERE status = 'scheduled' AND starts_at <= ? AND ends_at > ?`)
    .all(ts, ts) as Lot[];
  for (const lot of toOpen) {
    db.prepare(`UPDATE lots SET status = 'live' WHERE id = ?`).run(lot.id);
    publish({ type: "lot_opened", lotId: lot.id, lotSlug: lot.slug, endsAt: lot.ends_at, at: ts });
    opened++;
  }

  const toClose = db
    .prepare(`SELECT * FROM lots WHERE status IN ('live','scheduled') AND ends_at <= ?`)
    .all(ts) as Lot[];
  for (const lot of toClose) {
    settleLot(lot);
    closed++;
  }

  db.prepare(
    `UPDATE auctions SET status = 'live' WHERE status = 'scheduled' AND starts_at <= ? AND ends_at > ?`,
  ).run(ts, ts);
  db.prepare(`UPDATE auctions SET status = 'ended' WHERE status IN ('scheduled','live') AND ends_at <= ?`).run(ts);

  return { opened, closed };
}

function settleLot(lot: Lot): void {
  const ts = now();
  const top = db
    .prepare(
      `SELECT b.*, u.name FROM bids b JOIN users u ON u.id = b.user_id
        WHERE b.lot_id = ? ORDER BY b.amount DESC, b.is_auto DESC, b.created_at ASC, b.id ASC LIMIT 1`,
    )
    .get(lot.id) as (Bid & { name: string }) | undefined;

  const reserveMet = !lot.has_reserve || (lot.reserve != null && lot.current_bid >= lot.reserve);
  const sold = Boolean(top) && reserveMet;

  db.prepare(`UPDATE lots SET status = ?, winner_id = ? WHERE id = ?`).run(
    sold ? "sold" : "unsold",
    sold ? top!.user_id : null,
    lot.id,
  );

  if (sold && top) {
    const auction = db.prepare(`SELECT buyers_premium_bps FROM auctions WHERE id = ?`).get(
      lot.auction_id,
    ) as { buyers_premium_bps: number };
    const hammer = lot.current_bid;
    const premium = Math.round((hammer * auction.buyers_premium_bps) / 10_000);

    const already = db.prepare(`SELECT id FROM invoices WHERE lot_id = ?`).get(lot.id);
    if (!already) {
      db.prepare(
        `INSERT INTO invoices (lot_id, user_id, hammer_price, premium, total, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(lot.id, top.user_id, hammer, premium, hammer + premium, ts);
    }

    notify(top.user_id, {
      type: "won",
      title: `You won Lot ${lot.lot_no}`,
      body: `${lot.title} — hammer ${fmt(hammer)}. Your invoice is ready.`,
      link: `/dashboard/invoices`,
    });
  }

  // Everyone who bid and lost deserves to hear it from us, not from the page.
  const losers = db
    .prepare(`SELECT DISTINCT user_id FROM bids WHERE lot_id = ? AND user_id != ?`)
    .all(lot.id, sold && top ? top.user_id : -1) as Array<{ user_id: number }>;
  for (const l of losers) {
    notify(l.user_id, {
      type: "lot_closed",
      title: `Lot ${lot.lot_no} closed`,
      body: sold
        ? `${lot.title} sold for ${fmt(lot.current_bid)}.`
        : `${lot.title} did not meet its reserve.`,
      link: `/lots/${lot.slug}`,
    });
  }

  publish({
    type: "lot_closed",
    lotId: lot.id,
    lotSlug: lot.slug,
    status: sold ? "sold" : "unsold",
    hammer: lot.current_bid,
    winnerId: sold && top ? top.user_id : null,
    winnerName: sold && top ? top.name : null,
    at: ts,
  });
}
