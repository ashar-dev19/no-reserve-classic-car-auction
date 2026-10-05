import type { LotView } from "./types";

/**
 * The subset of a lot that a card renders. Kept out of the card component
 * itself because that component is a client module, and server pages need to
 * build this shape before handing it across the boundary.
 */
export interface LotCardData {
  id: number;
  slug: string;
  lot_no: string;
  title: string;
  summary: string | null;
  image: string;
  mileage: number | null;
  location: string | null;
  category: string | null;
  current_bid: number;
  starting_bid: number;
  bid_count: number;
  view_count: number;
  ends_at: number;
  status: string;
  has_reserve: number;
  reserve_met: boolean;
  featured: number;
}

export function toCardData(lot: LotView): LotCardData {
  return {
    id: lot.id,
    slug: lot.slug,
    lot_no: lot.lot_no,
    title: lot.title,
    summary: lot.summary,
    image: lot.images[0] ?? "/cars/hero-wide.jpg",
    mileage: lot.mileage,
    location: lot.location,
    category: lot.category,
    current_bid: lot.current_bid,
    starting_bid: lot.starting_bid,
    bid_count: lot.bid_count,
    view_count: lot.view_count,
    ends_at: lot.ends_at,
    status: lot.status,
    has_reserve: lot.has_reserve,
    reserve_met: lot.reserve_met,
    featured: lot.featured,
  };
}
