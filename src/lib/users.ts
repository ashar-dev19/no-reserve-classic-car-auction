import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { db, now } from "./db";
import type { PublicUser, Role, User } from "./types";

/**
 * Accounts and password hashing.
 *
 * Deliberately free of any Next.js request context, so the seed script and any
 * other command-line tool can create users without pulling in `next/headers`.
 * Session handling lives in `auth.ts`, which re-exports everything here.
 */

const PUBLIC_COLUMNS = `id, email, name, phone, company, role, bidder_status, bid_limit, paddle_no, created_at`;

export function hashPassword(plain: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(plain, salt, 64);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [scheme, saltHex, keyHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !keyHex) return false;
  const key = scryptSync(plain, Buffer.from(saltHex, "hex"), 64);
  const expected = Buffer.from(keyHex, "hex");
  return key.length === expected.length && timingSafeEqual(key, expected);
}

export function findUserByEmail(email: string): User | undefined {
  return db.prepare(`SELECT * FROM users WHERE email = ?`).get(email.toLowerCase()) as
    | User
    | undefined;
}

export function getUserById(id: number): PublicUser | undefined {
  return db.prepare(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ?`).get(id) as
    | PublicUser
    | undefined;
}

export function createUser(input: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  company?: string;
  role?: Role;
  bidder_status?: string;
}): PublicUser {
  const info = db
    .prepare(
      `INSERT INTO users (email, password_hash, name, phone, company, role, bidder_status, paddle_no, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.email.toLowerCase().trim(),
      hashPassword(input.password),
      input.name.trim(),
      input.phone ?? null,
      input.company ?? null,
      input.role ?? "bidder",
      input.bidder_status ?? "pending",
      nextPaddle(),
      now(),
    );

  return getUserById(info.lastInsertRowid as number)!;
}

function nextPaddle(): string {
  const row = db.prepare(`SELECT COUNT(*) AS c FROM users`).get() as { c: number };
  return String(101 + row.c);
}
