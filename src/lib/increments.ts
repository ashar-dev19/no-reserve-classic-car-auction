/**
 * The bid increment ladder — pure, with no database access, so the bid form can
 * compute the next legal bid on the client and the engine can enforce the same
 * number on the server.
 *
 * All values are integer cents.
 */

const LADDER: Array<[ceiling: number, step: number]> = [
  [1_000_00, 25_00],
  [5_000_00, 100_00],
  [25_000_00, 250_00],
  [50_000_00, 500_00],
  [100_000_00, 1_000_00],
  [250_000_00, 2_500_00],
  [500_000_00, 5_000_00],
  [Number.MAX_SAFE_INTEGER, 10_000_00],
];

/** Minimum step above `cents`. */
export function increment(cents: number): number {
  for (const [ceiling, step] of LADDER) if (cents < ceiling) return step;
  return 10_000_00;
}

/** The smallest bid the next bidder may legally place. */
export function nextMinimumBid(lot: {
  current_bid: number;
  bid_count: number;
  starting_bid: number;
}): number {
  if (lot.bid_count === 0) return lot.starting_bid;
  return lot.current_bid + increment(lot.current_bid);
}

/** Three one-tap options above the minimum, for the quick-bid buttons. */
export function quickBidOptions(minimum: number): number[] {
  const step = increment(minimum);
  return [minimum, minimum + step, minimum + step * 3];
}
