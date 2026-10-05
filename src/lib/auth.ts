import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { getUserById } from "./users";
import type { PublicUser, Role } from "./types";

/**
 * Sessions. Account creation and password hashing live in `users.ts`, which
 * imports nothing from Next — so the seed script and other command-line tools
 * can make users without dragging in `next/headers`.
 */
export {
  createUser,
  findUserByEmail,
  getUserById,
  hashPassword,
  verifyPassword,
} from "./users";

const COOKIE = "nrc_session";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 days

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "nrc-auctions-dev-secret-change-in-production-0001",
);

export async function createSession(userId: number, role: Role): Promise<void> {
  const token = await new SignJWT({ uid: userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret);

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

/** Returns the signed-in user, or null. Safe to call from any server context. */
export async function getCurrentUser(): Promise<PublicUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return getUserById(payload.uid as number) ?? null;
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Sign in to continue", 401);
  return user;
}

export async function requireAdmin(): Promise<PublicUser> {
  const user = await requireUser();
  if (user.role !== "admin") throw new AuthError("Administrator access required", 403);
  return user;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "AuthError";
  }
}
