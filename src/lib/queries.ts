import { db } from "./db";
import type { Auction, Comment, Invoice, LotView, Notification } from "./types";
import { getLotById, listLots, type LotQuery } from "./auction";

export function getAuctions(status?: string): Auction[] {
  if (status) {
    return db
      .prepare(`SELECT * FROM auctions WHERE status = ? ORDER BY starts_at ASC`)
      .all(status) as Auction[];
  }
  return db
    .prepare(
      `SELECT * FROM auctions
        ORDER BY CASE status WHEN 'live' THEN 0 WHEN 'scheduled' THEN 1 ELSE 2 END, starts_at ASC`,
    )
    .all() as Auction[];
}

export function getAuctionBySlug(slug: string): Auction | null {
  return (db.prepare(`SELECT * FROM auctions WHERE slug = ?`).get(slug) as Auction) ?? null;
}

export function auctionLotStats(auctionId: number): {
  total: number;
  open: number;
  sold: number;
  hammer: number;
} {
  return db
    .prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status IN ('live','scheduled') THEN 1 ELSE 0 END) AS open,
              SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) AS sold,
              COALESCE(SUM(CASE WHEN status = 'sold' THEN current_bid ELSE 0 END), 0) AS hammer
         FROM lots WHERE auction_id = ? AND status != 'draft'`,
    )
    .get(auctionId) as { total: number; open: number; sold: number; hammer: number };
}

export function platformStats(): {
  lotsSold: number;
  hammerTotal: number;
  liveNow: number;
  registeredBidders: number;
  sellThroughPct: number;
} {
  const row = db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM lots WHERE status = 'sold')                       AS lotsSold,
         (SELECT COALESCE(SUM(current_bid),0) FROM lots WHERE status='sold')     AS hammerTotal,
         (SELECT COUNT(*) FROM lots WHERE status = 'live')                       AS liveNow,
         (SELECT COUNT(*) FROM users WHERE bidder_status = 'approved')           AS registeredBidders,
         (SELECT COUNT(*) FROM lots WHERE status IN ('sold','unsold'))           AS settled`,
    )
    .get() as Record<string, number>;

  return {
    lotsSold: row.lotsSold ?? 0,
    hammerTotal: row.hammerTotal ?? 0,
    liveNow: row.liveNow ?? 0,
    registeredBidders: row.registeredBidders ?? 0,
    sellThroughPct: row.settled ? Math.round((row.lotsSold / row.settled) * 100) : 0,
  };
}

export function getComments(lotId: number): Comment[] {
  return db
    .prepare(
      `SELECT c.*, u.name AS author_name, u.role AS author_role
         FROM comments c JOIN users u ON u.id = c.user_id
        WHERE c.lot_id = ?
        ORDER BY c.created_at ASC`,
    )
    .all(lotId) as Comment[];
}

export function isWatching(userId: number, lotId: number): boolean {
  return Boolean(
    db.prepare(`SELECT 1 FROM watchlist WHERE user_id = ? AND lot_id = ?`).get(userId, lotId),
  );
}

export function getWatchlist(userId: number): LotView[] {
  const rows = db
    .prepare(`SELECT lot_id FROM watchlist WHERE user_id = ? ORDER BY created_at DESC`)
    .all(userId) as Array<{ lot_id: number }>;
  return rows.map((r) => getLotById(r.lot_id)).filter((l): l is LotView => l !== null);
}

/** Lots the user has bid on, newest activity first, with their standing. */
export function getUserBidSummary(userId: number) {
  const rows = db
    .prepare(
      `SELECT l.id, l.slug, l.lot_no, l.title, l.images, l.current_bid, l.bid_count,
              l.ends_at, l.status, l.has_reserve, l.reserve, l.winner_id,
              MAX(b.amount)     AS my_high,
              MAX(b.max_amount) AS my_max,
              MAX(b.created_at) AS last_bid_at
         FROM bids b JOIN lots l ON l.id = b.lot_id
        WHERE b.user_id = ?
        GROUP BY l.id
        ORDER BY last_bid_at DESC`,
    )
    .all(userId) as Array<Record<string, never>>;

  return (rows as unknown as Array<{
    id: number;
    slug: string;
    lot_no: string;
    title: string;
    images: string;
    current_bid: number;
    bid_count: number;
    ends_at: number;
    status: string;
    has_reserve: number;
    reserve: number | null;
    winner_id: number | null;
    my_high: number;
    my_max: number;
    last_bid_at: number;
  }>).map((r) => {
    const topBidder = db
      .prepare(
        `SELECT user_id FROM bids WHERE lot_id = ?
          ORDER BY amount DESC, is_auto DESC, created_at ASC, id ASC LIMIT 1`,
      )
      .get(r.id) as { user_id: number } | undefined;

    const leading = topBidder?.user_id === userId;
    const closed = r.status === "sold" || r.status === "unsold";

    return {
      ...r,
      image: safeFirstImage(r.images),
      leading,
      standing: closed
        ? r.winner_id === userId
          ? ("won" as const)
          : ("lost" as const)
        : leading
          ? ("leading" as const)
          : ("outbid" as const),
    };
  });
}

export function getInvoices(userId: number) {
  return db
    .prepare(
      `SELECT i.*, l.title, l.slug, l.lot_no, l.images
         FROM invoices i JOIN lots l ON l.id = i.lot_id
        WHERE i.user_id = ?
        ORDER BY i.created_at DESC`,
    )
    .all(userId) as Array<Invoice & { title: string; slug: string; lot_no: string; images: string }>;
}

export function getNotifications(userId: number, limit = 50): Notification[] {
  return db
    .prepare(`SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`)
    .all(userId, limit) as Notification[];
}

export function unreadCount(userId: number): number {
  const row = db
    .prepare(`SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read_at IS NULL`)
    .get(userId) as { c: number };
  return row.c;
}

export function distinctValues(column: "make" | "category"): string[] {
  const rows = db
    .prepare(
      `SELECT DISTINCT ${column} AS v FROM lots
        WHERE ${column} IS NOT NULL AND status != 'draft' ORDER BY v`,
    )
    .all() as Array<{ v: string }>;
  return rows.map((r) => r.v);
}

export function featuredLots(limit = 6) {
  const featured = listLots({ featured: true, status: "open", sort: "ending", limit });
  if (featured.length >= limit) return featured;
  const filler = listLots({ status: "open", sort: "bids", limit: limit * 2 }).filter(
    (l) => !featured.some((f) => f.id === l.id),
  );
  return [...featured, ...filler].slice(0, limit);
}

export function endingSoon(limit = 8) {
  return listLots({ status: "live", sort: "ending", limit });
}

export function recentResults(limit = 6) {
  return listLots({ status: "sold", sort: "price_desc", limit });
}

export function searchLots(q: LotQuery) {
  return listLots(q);
}

function safeFirstImage(raw: string): string {
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) && arr[0] ? arr[0] : "/cars/hero-wide.jpg";
  } catch {
    return "/cars/hero-wide.jpg";
  }
}

export { safeFirstImage };
