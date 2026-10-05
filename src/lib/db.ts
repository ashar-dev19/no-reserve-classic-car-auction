import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "auction.db");

declare global {
  // eslint-disable-next-line no-var
  var __auctionDb: Database.Database | undefined;
}

function create(): Database.Database {
  // Create the directory the database actually lives in. Deriving this from
  // DB_PATH rather than from the working directory matters in a container,
  // where the volume is mounted outside the app directory and the app runs as
  // a user with no write access to it.
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  migrate(db);
  return db;
}

export const db: Database.Database = globalThis.__auctionDb ?? create();
if (process.env.NODE_ENV !== "production") globalThis.__auctionDb = db;

function migrate(db: Database.Database) {
  db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name          TEXT NOT NULL,
    phone         TEXT,
    company       TEXT,
    role          TEXT NOT NULL DEFAULT 'bidder',      -- bidder | admin
    bidder_status TEXT NOT NULL DEFAULT 'pending',     -- pending | approved | suspended
    bid_limit     INTEGER NOT NULL DEFAULT 0,          -- cents; 0 = unlimited once approved
    paddle_no     TEXT,
    created_at    INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS auctions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    slug        TEXT NOT NULL UNIQUE,
    title       TEXT NOT NULL,
    subtitle    TEXT,
    description TEXT,
    venue       TEXT,
    location    TEXT,
    hero_image  TEXT,
    starts_at   INTEGER NOT NULL,
    ends_at     INTEGER NOT NULL,
    status      TEXT NOT NULL DEFAULT 'scheduled',     -- draft | scheduled | live | ended
    buyers_premium_bps INTEGER NOT NULL DEFAULT 1000,  -- 10.00%
    created_at  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS lots (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    auction_id    INTEGER NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    seller_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    lot_no        TEXT NOT NULL,
    slug          TEXT NOT NULL UNIQUE,
    title         TEXT NOT NULL,
    year          INTEGER,
    make          TEXT,
    model         TEXT,
    category      TEXT,
    vin           TEXT,
    mileage       INTEGER,
    engine        TEXT,
    transmission  TEXT,
    drivetrain    TEXT,
    exterior      TEXT,
    interior      TEXT,
    location      TEXT,
    summary       TEXT,
    description   TEXT,
    highlights    TEXT NOT NULL DEFAULT '[]',          -- JSON array
    flaws         TEXT NOT NULL DEFAULT '[]',          -- JSON array
    images        TEXT NOT NULL DEFAULT '[]',          -- JSON array of paths
    estimate_low  INTEGER,
    estimate_high INTEGER,
    reserve       INTEGER,                              -- cents; NULL when no reserve
    has_reserve   INTEGER NOT NULL DEFAULT 0,
    starting_bid  INTEGER NOT NULL DEFAULT 100000,
    current_bid   INTEGER NOT NULL DEFAULT 0,
    bid_count     INTEGER NOT NULL DEFAULT 0,
    view_count    INTEGER NOT NULL DEFAULT 0,
    starts_at     INTEGER NOT NULL,
    ends_at       INTEGER NOT NULL,
    status        TEXT NOT NULL DEFAULT 'scheduled',   -- draft | scheduled | live | sold | unsold
    featured      INTEGER NOT NULL DEFAULT 0,
    winner_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at    INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bids (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    lot_id      INTEGER NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount      INTEGER NOT NULL,                      -- visible bid, cents
    max_amount  INTEGER NOT NULL,                      -- proxy ceiling, cents
    is_auto     INTEGER NOT NULL DEFAULT 0,            -- placed by the proxy engine
    created_at  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS watchlist (
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lot_id     INTEGER NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, lot_id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    lot_id     INTEGER NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body       TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       TEXT NOT NULL,                          -- outbid | won | ending | approved | comment
    title      TEXT NOT NULL,
    body       TEXT,
    link       TEXT,
    read_at    INTEGER,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    lot_id        INTEGER NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hammer_price  INTEGER NOT NULL,
    premium       INTEGER NOT NULL,
    total         INTEGER NOT NULL,
    status        TEXT NOT NULL DEFAULT 'due',         -- due | paid | void
    created_at    INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS consignments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    phone       TEXT,
    year        INTEGER,
    make        TEXT,
    model       TEXT,
    mileage     INTEGER,
    reserve_pref TEXT,
    notes       TEXT,
    status      TEXT NOT NULL DEFAULT 'new',           -- new | reviewing | accepted | declined
    created_at  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rsvps (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    auction_id INTEGER REFERENCES auctions(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    phone      TEXT,
    brokerage  TEXT,
    guests     INTEGER NOT NULL DEFAULT 0,
    intent     TEXT,                                   -- bidding | attending | consigning
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_lots_auction  ON lots(auction_id);
  CREATE INDEX IF NOT EXISTS idx_lots_status   ON lots(status, ends_at);
  CREATE INDEX IF NOT EXISTS idx_bids_lot      ON bids(lot_id, amount DESC);
  CREATE INDEX IF NOT EXISTS idx_bids_user     ON bids(user_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_notif_user    ON notifications(user_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_comments_lot  ON comments(lot_id, created_at DESC);
  `);
}

export function now(): number {
  return Date.now();
}
