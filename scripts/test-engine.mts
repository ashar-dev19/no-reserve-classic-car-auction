/**
 * End-to-end exercise of the auction engine against a throwaway database.
 *
 *   npm run test:engine
 *
 * Covers the rules that actually decide who owns the car: proxy resolution,
 * minimum increments, soft close, reserves, settlement and bidder eligibility.
 */
import fs from "node:fs";
import path from "node:path";

const TEST_DB = path.join(process.cwd(), "data", "test-engine.db");
for (const f of [TEST_DB, `${TEST_DB}-wal`, `${TEST_DB}-shm`]) {
  if (fs.existsSync(f)) fs.rmSync(f);
}
process.env.DATABASE_PATH = TEST_DB;

const { db } = await import("../src/lib/db");
const { createUser } = await import("../src/lib/users");
const { placeBid, sweep, increment, getBids, getLotById } = await import("../src/lib/auction");

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}${detail ? `\n      ${detail}` : ""}`);
  }
}

function eq(name: string, actual: unknown, expected: unknown) {
  check(name, Object.is(actual, expected), `expected ${String(expected)}, got ${String(actual)}`);
}

const H = 3_600_000;
const usd = (d: number) => d * 100;

/* ── Fixtures ───────────────────────────────────────────────── */

const alice = createUser({
  email: "alice@test.local",
  password: "password123",
  name: "Alice Archer",
  bidder_status: "approved",
});
const bob = createUser({
  email: "bob@test.local",
  password: "password123",
  name: "Bob Bramley",
  bidder_status: "approved",
});
const carol = createUser({
  email: "carol@test.local",
  password: "password123",
  name: "Carol Crane",
  bidder_status: "approved",
});
const pendingUser = createUser({
  email: "pending@test.local",
  password: "password123",
  name: "Pat Pending",
  bidder_status: "pending",
});
const capped = createUser({
  email: "capped@test.local",
  password: "password123",
  name: "Cap Capper",
  bidder_status: "approved",
});
db.prepare(`UPDATE users SET bid_limit = ? WHERE id = ?`).run(usd(20_000), capped.id);

const auctionId = db
  .prepare(
    `INSERT INTO auctions (slug, title, starts_at, ends_at, status, buyers_premium_bps, created_at)
     VALUES ('t','Test Sale', ?, ?, 'live', 1000, ?)`,
  )
  .run(Date.now() - H, Date.now() + 100 * H, Date.now()).lastInsertRowid as number;

let lotSeq = 0;
function makeLot(options: {
  startingBid: number;
  reserve?: number | null;
  endsInMs?: number;
}): number {
  lotSeq++;
  const ts = Date.now();
  return db
    .prepare(
      `INSERT INTO lots (auction_id, lot_no, slug, title, starting_bid, current_bid, bid_count,
                         reserve, has_reserve, starts_at, ends_at, status, created_at)
       VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, 'live', ?)`,
    )
    .run(
      auctionId,
      String(lotSeq),
      `lot-${lotSeq}`,
      `Test Lot ${lotSeq}`,
      options.startingBid,
      options.reserve ?? null,
      options.reserve == null ? 0 : 1,
      ts - H,
      ts + (options.endsInMs ?? 48 * H),
      ts,
    ).lastInsertRowid as number;
}

/* ── 1. Opening bid ─────────────────────────────────────────── */

console.log("\nOpening bid");
{
  const lot = makeLot({ startingBid: usd(10_000) });

  const low = placeBid({ lotId: lot, userId: alice.id, maxAmount: usd(9_000) });
  check("a bid under the starting bid is rejected", !low.ok);

  const first = placeBid({ lotId: lot, userId: alice.id, maxAmount: usd(10_000) });
  check("the first bid at the starting bid is accepted", first.ok);
  eq("price opens at the starting bid", getLotById(lot)!.current_bid, usd(10_000));
  eq("the opening bidder leads", getLotById(lot)!.high_bidder_id, alice.id);
}

/* ── 2. Increment enforcement ───────────────────────────────── */

console.log("\nIncrement ladder");
{
  const lot = makeLot({ startingBid: usd(10_000) });
  placeBid({ lotId: lot, userId: alice.id, maxAmount: usd(10_000) });

  const step = increment(usd(10_000));
  eq("the $10k increment is $250", step, usd(250));

  const tooLow = placeBid({ lotId: lot, userId: bob.id, maxAmount: usd(10_100) });
  check("a bid below the next increment is rejected", !tooLow.ok);

  const ok = placeBid({ lotId: lot, userId: bob.id, maxAmount: usd(10_250) });
  check("a bid at exactly the next increment is accepted", ok.ok);
}

/* ── 3. Proxy resolution ────────────────────────────────────── */

console.log("\nProxy bidding");
{
  // Alice holds a high ceiling; Bob challenges below it and should lose.
  const lot = makeLot({ startingBid: usd(10_000) });
  placeBid({ lotId: lot, userId: alice.id, maxAmount: usd(25_000) });
  eq("a high ceiling does not reveal itself", getLotById(lot)!.current_bid, usd(10_000));

  const challenge = placeBid({ lotId: lot, userId: bob.id, maxAmount: usd(15_000) });
  check("the challenger is told they were outbid", challenge.ok && challenge.status === "outbid");

  const afterChallenge = getLotById(lot)!;
  eq("the standing proxy still leads", afterChallenge.high_bidder_id, alice.id);
  eq(
    "price advances one increment above the challenger",
    afterChallenge.current_bid,
    usd(15_000) + increment(usd(15_000)),
  );

  // Carol goes over Alice's ceiling and should take the lead.
  const over = placeBid({ lotId: lot, userId: carol.id, maxAmount: usd(40_000) });
  check("a bid above the standing ceiling takes the lead", over.ok && over.status === "leading");

  const afterOver = getLotById(lot)!;
  eq("the new leader is the higher ceiling", afterOver.high_bidder_id, carol.id);
  eq(
    "price settles one increment above the beaten ceiling",
    afterOver.current_bid,
    usd(25_000) + increment(usd(25_000)),
  );
  check(
    "the beaten proxy is recorded fighting to its ceiling",
    getBids(lot).some((b) => b.user_id === alice.id && b.amount === usd(25_000) && b.is_auto === 1),
  );
}

/* ── 4. Raising your own maximum ────────────────────────────── */

console.log("\nRaising your own maximum");
{
  const lot = makeLot({ startingBid: usd(10_000) });
  placeBid({ lotId: lot, userId: alice.id, maxAmount: usd(12_000) });
  const priceBefore = getLotById(lot)!.current_bid;

  const raise = placeBid({ lotId: lot, userId: alice.id, maxAmount: usd(30_000) });
  check("the leader may raise their own ceiling", raise.ok && raise.status === "max_raised");
  eq("raising a ceiling does not move the price", getLotById(lot)!.current_bid, priceBefore);

  const lower = placeBid({ lotId: lot, userId: alice.id, maxAmount: usd(20_000) });
  check("the leader cannot lower their ceiling", !lower.ok);
}

/* ── 5. Soft close ──────────────────────────────────────────── */

console.log("\nSoft close");
{
  const lot = makeLot({ startingBid: usd(10_000), endsInMs: 90_000 });
  const before = getLotById(lot)!.ends_at;

  const late = placeBid({ lotId: lot, userId: alice.id, maxAmount: usd(10_000) });
  check("a bid inside the final two minutes extends the clock", late.ok && late.extended === true);

  const after = getLotById(lot)!.ends_at;
  check("the clock moved out", after > before, `before ${before}, after ${after}`);
  check(
    "the extension is about two minutes from now",
    Math.abs(after - (Date.now() + 120_000)) < 5_000,
  );

  const early = makeLot({ startingBid: usd(10_000), endsInMs: 48 * H });
  const earlyBid = placeBid({ lotId: early, userId: alice.id, maxAmount: usd(10_000) });
  check("an early bid does not extend the clock", earlyBid.ok && earlyBid.extended === false);
}

/* ── 6. Eligibility ─────────────────────────────────────────── */

console.log("\nBidder eligibility");
{
  const lot = makeLot({ startingBid: usd(10_000) });

  const pendingBid = placeBid({ lotId: lot, userId: pendingUser.id, maxAmount: usd(10_000) });
  check("an unapproved bidder is refused", !pendingBid.ok);

  const overLimit = placeBid({ lotId: lot, userId: capped.id, maxAmount: usd(25_000) });
  check("a bid above an account's limit is refused", !overLimit.ok);

  const underLimit = placeBid({ lotId: lot, userId: capped.id, maxAmount: usd(15_000) });
  check("a bid within the limit is accepted", underLimit.ok);

  db.prepare(`UPDATE users SET bidder_status = 'suspended' WHERE id = ?`).run(bob.id);
  const suspended = placeBid({ lotId: lot, userId: bob.id, maxAmount: usd(50_000) });
  check("a suspended bidder is refused", !suspended.ok);
  db.prepare(`UPDATE users SET bidder_status = 'approved' WHERE id = ?`).run(bob.id);
}

/* ── 6b. Equal maximums ─────────────────────────────────────── */

console.log("\nEqual maximums");
{
  const lot = makeLot({ startingBid: usd(10_000) });
  placeBid({ lotId: lot, userId: alice.id, maxAmount: usd(20_000) });
  placeBid({ lotId: lot, userId: carol.id, maxAmount: usd(20_000) });

  const tied = getLotById(lot)!;
  eq("on equal maximums the earlier bidder keeps the lot", tied.high_bidder_id, alice.id);
  eq("the price rises to the shared ceiling", tied.current_bid, usd(20_000));
}

/* ── 6c. The reserve lift ───────────────────────────────────── */

console.log("\nReserve lift");
{
  // A single bidder willing to pay over the reserve must be able to meet it,
  // even with nobody bidding against them.
  const lot = makeLot({ startingBid: usd(10_000), reserve: usd(20_000) });
  placeBid({ lotId: lot, userId: alice.id, maxAmount: usd(32_000) });

  const lifted = getLotById(lot)!;
  eq("an unopposed bid over the reserve lifts the price to it", lifted.current_bid, usd(20_000));
  check("the reserve reads as met", lifted.reserve_met);
  check(
    "the price stops at the reserve, not the bidder's ceiling",
    lifted.current_bid < usd(32_000),
  );

  // Raising a ceiling past the reserve should lift the price the same way.
  const slow = makeLot({ startingBid: usd(10_000), reserve: usd(20_000) });
  placeBid({ lotId: slow, userId: bob.id, maxAmount: usd(15_000) });
  check("below the reserve the lot stays short of it", !getLotById(slow)!.reserve_met);
  placeBid({ lotId: slow, userId: bob.id, maxAmount: usd(26_000) });
  eq("raising a ceiling past the reserve lifts the price", getLotById(slow)!.current_bid, usd(20_000));
  check("the reserve now reads as met", getLotById(slow)!.reserve_met);
}

/* ── 7. Reserve met: sold, with an invoice ──────────────────── */

console.log("\nSettlement — reserve met");
{
  const lot = makeLot({ startingBid: usd(10_000), reserve: usd(20_000) });
  placeBid({ lotId: lot, userId: alice.id, maxAmount: usd(18_000) });
  check("reserve is not met below it", !getLotById(lot)!.reserve_met);

  placeBid({ lotId: lot, userId: carol.id, maxAmount: usd(32_000) });
  check("reserve is met once a ceiling covers it", getLotById(lot)!.reserve_met);

  const hammer = getLotById(lot)!.current_bid;

  db.prepare(`UPDATE lots SET ends_at = ? WHERE id = ?`).run(Date.now() - 1, lot);
  sweep();

  const settled = getLotById(lot)!;
  eq("the lot is marked sold", settled.status, "sold");
  eq("the winner is the high bidder", settled.winner_id, carol.id);

  const invoice = db.prepare(`SELECT * FROM invoices WHERE lot_id = ?`).get(lot) as
    | { hammer_price: number; premium: number; total: number; user_id: number }
    | undefined;
  check("an invoice was raised", invoice != null);
  if (invoice) {
    eq("the invoice records the hammer price", invoice.hammer_price, hammer);
    eq("the premium is 10% of hammer", invoice.premium, Math.round(hammer * 0.1));
    eq("the total is hammer plus premium", invoice.total, hammer + invoice.premium);
    eq("the invoice is addressed to the winner", invoice.user_id, carol.id);
  }

  check(
    "the winner was notified",
    (db.prepare(`SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND type = 'won'`).get(
      carol.id,
    ) as { c: number }).c > 0,
  );
}

/* ── 8. Reserve not met: unsold, no invoice ─────────────────── */

console.log("\nSettlement — reserve not met");
{
  const lot = makeLot({ startingBid: usd(10_000), reserve: usd(90_000) });
  placeBid({ lotId: lot, userId: alice.id, maxAmount: usd(15_000) });

  db.prepare(`UPDATE lots SET ends_at = ? WHERE id = ?`).run(Date.now() - 1, lot);
  sweep();

  const settled = getLotById(lot)!;
  eq("the lot is marked unsold", settled.status, "unsold");
  eq("no winner is recorded", settled.winner_id, null);
  check(
    "no invoice was raised",
    db.prepare(`SELECT COUNT(*) AS c FROM invoices WHERE lot_id = ?`).get(lot) != null &&
      (db.prepare(`SELECT COUNT(*) AS c FROM invoices WHERE lot_id = ?`).get(lot) as { c: number })
        .c === 0,
  );
}

/* ── 9. No reserve always sells ─────────────────────────────── */

console.log("\nNo-reserve lots");
{
  const lot = makeLot({ startingBid: usd(1_000) });
  placeBid({ lotId: lot, userId: alice.id, maxAmount: usd(1_000) });

  db.prepare(`UPDATE lots SET ends_at = ? WHERE id = ?`).run(Date.now() - 1, lot);
  sweep();

  eq("a no-reserve lot sells at any price", getLotById(lot)!.status, "sold");
}

/* ── 10. Closed lots reject bids ────────────────────────────── */

console.log("\nClosed lots");
{
  const lot = makeLot({ startingBid: usd(10_000) });
  db.prepare(`UPDATE lots SET ends_at = ?, status = 'sold' WHERE id = ?`).run(Date.now() - 1, lot);

  const afterClose = placeBid({ lotId: lot, userId: alice.id, maxAmount: usd(50_000) });
  check("a bid on a closed lot is rejected", !afterClose.ok);
}

/* ── 11. Privacy: ceilings never leave the engine ───────────── */

console.log("\nBid privacy");
{
  const lot = makeLot({ startingBid: usd(10_000) });
  placeBid({ lotId: lot, userId: alice.id, maxAmount: usd(85_000) });

  const visible = getBids(lot);
  check(
    "no visible bid reveals the hidden ceiling",
    visible.every((b) => b.amount < usd(85_000)),
  );
  eq("the displayed price is the opening bid", getLotById(lot)!.current_bid, usd(10_000));
}

/* ── Summary ────────────────────────────────────────────────── */

console.log(`
  ───────────────────────────────────────────
  ${passed} passed, ${failed} failed
  ───────────────────────────────────────────
`);

db.close();
for (const f of [TEST_DB, `${TEST_DB}-wal`, `${TEST_DB}-shm`]) {
  if (fs.existsSync(f)) fs.rmSync(f);
}

process.exit(failed > 0 ? 1 : 0);
