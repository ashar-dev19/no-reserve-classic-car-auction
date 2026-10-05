export type Role = "bidder" | "admin";
export type BidderStatus = "pending" | "approved" | "suspended";
export type AuctionStatus = "draft" | "scheduled" | "live" | "ended";
export type LotStatus = "draft" | "scheduled" | "live" | "sold" | "unsold";

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  phone: string | null;
  company: string | null;
  role: Role;
  bidder_status: BidderStatus;
  bid_limit: number;
  paddle_no: string | null;
  created_at: number;
}

export type PublicUser = Omit<User, "password_hash">;

export interface Auction {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  venue: string | null;
  location: string | null;
  hero_image: string | null;
  starts_at: number;
  ends_at: number;
  status: AuctionStatus;
  buyers_premium_bps: number;
  created_at: number;
}

export interface Lot {
  id: number;
  auction_id: number;
  seller_id: number | null;
  lot_no: string;
  slug: string;
  title: string;
  year: number | null;
  make: string | null;
  model: string | null;
  category: string | null;
  vin: string | null;
  mileage: number | null;
  engine: string | null;
  transmission: string | null;
  drivetrain: string | null;
  exterior: string | null;
  interior: string | null;
  location: string | null;
  summary: string | null;
  description: string | null;
  highlights: string;
  flaws: string;
  images: string;
  estimate_low: number | null;
  estimate_high: number | null;
  reserve: number | null;
  has_reserve: number;
  starting_bid: number;
  current_bid: number;
  bid_count: number;
  view_count: number;
  starts_at: number;
  ends_at: number;
  status: LotStatus;
  featured: number;
  winner_id: number | null;
  created_at: number;
}

/** A lot with JSON columns parsed and derived fields resolved. */
export interface LotView extends Omit<Lot, "highlights" | "flaws" | "images"> {
  highlights: string[];
  flaws: string[];
  images: string[];
  auction_slug?: string;
  auction_title?: string;
  reserve_met: boolean;
  high_bidder_id: number | null;
  high_bidder_name: string | null;
}

export interface Bid {
  id: number;
  lot_id: number;
  user_id: number;
  amount: number;
  max_amount: number;
  is_auto: number;
  created_at: number;
}

export interface BidRow extends Bid {
  bidder_name: string;
  paddle_no: string | null;
}

export interface Comment {
  id: number;
  lot_id: number;
  user_id: number;
  body: string;
  created_at: number;
  author_name?: string;
  author_role?: Role;
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: number | null;
  created_at: number;
}

export interface Invoice {
  id: number;
  lot_id: number;
  user_id: number;
  hammer_price: number;
  premium: number;
  total: number;
  status: "due" | "paid" | "void";
  created_at: number;
}
