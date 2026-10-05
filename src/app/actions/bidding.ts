"use server";

import { revalidatePath } from "next/cache";
import { db, now } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getLotById, placeBid } from "@/lib/auction";
import { publish } from "@/lib/events";

export interface BidResult {
  ok: boolean;
  message: string;
  status?: "leading" | "outbid" | "max_raised";
  currentBid?: number;
  extended?: boolean;
  needsAuth?: boolean;
  needsApproval?: boolean;
}

export async function placeBidAction(lotId: number, dollars: number): Promise<BidResult> {
  const user = await getCurrentUser();
  if (!user)
    return { ok: false, message: "Sign in to place a bid.", needsAuth: true };
  if (user.bidder_status !== "approved")
    return {
      ok: false,
      message:
        user.bidder_status === "suspended"
          ? "Your bidding privileges are suspended. Contact the auction office."
          : "Your bidder registration is still under review.",
      needsApproval: true,
    };

  if (!Number.isFinite(dollars) || dollars <= 0)
    return { ok: false, message: "Enter a bid amount." };

  const result = placeBid({
    lotId,
    userId: user.id,
    maxAmount: Math.round(dollars * 100),
  });

  if (!result.ok) return { ok: false, message: result.error };

  const lot = getLotById(lotId);
  if (lot) revalidatePath(`/lots/${lot.slug}`);

  return {
    ok: true,
    message: result.message,
    status: result.status,
    currentBid: result.lot.current_bid,
    extended: result.extended,
  };
}

export async function toggleWatchAction(
  lotId: number,
): Promise<{ ok: boolean; watching?: boolean; message?: string; needsAuth?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Sign in to save lots.", needsAuth: true };

  const existing = db
    .prepare(`SELECT 1 FROM watchlist WHERE user_id = ? AND lot_id = ?`)
    .get(user.id, lotId);

  if (existing) {
    db.prepare(`DELETE FROM watchlist WHERE user_id = ? AND lot_id = ?`).run(user.id, lotId);
    revalidatePath("/dashboard/watchlist");
    return { ok: true, watching: false };
  }

  db.prepare(`INSERT INTO watchlist (user_id, lot_id, created_at) VALUES (?, ?, ?)`).run(
    user.id,
    lotId,
    now(),
  );
  revalidatePath("/dashboard/watchlist");
  return { ok: true, watching: true };
}

export async function postCommentAction(
  lotId: number,
  body: string,
): Promise<{ ok: boolean; message?: string; needsAuth?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Sign in to join the conversation.", needsAuth: true };

  const text = body.trim();
  if (text.length < 2) return { ok: false, message: "Write a message first." };
  if (text.length > 2000) return { ok: false, message: "Keep comments under 2,000 characters." };

  db.prepare(`INSERT INTO comments (lot_id, user_id, body, created_at) VALUES (?, ?, ?, ?)`).run(
    lotId,
    user.id,
    text,
    now(),
  );

  const lot = getLotById(lotId);
  if (lot) {
    publish({ type: "comment", lotId, lotSlug: lot.slug, at: now() });
    revalidatePath(`/lots/${lot.slug}`);
  }
  return { ok: true };
}

export async function markNotificationsReadAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  db.prepare(`UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL`).run(
    now(),
    user.id,
  );
  revalidatePath("/dashboard/notifications");
}
