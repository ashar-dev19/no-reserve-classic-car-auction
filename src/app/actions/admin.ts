"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, now } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { notify, sweep } from "@/lib/auction";
import { slugify } from "@/lib/format";

export interface AdminState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/* ── Bidder administration ──────────────────────────────────── */

export async function setBidderStatusAction(userId: number, status: string): Promise<void> {
  await requireAdmin();
  if (!["pending", "approved", "suspended"].includes(status)) return;

  const before = db.prepare(`SELECT bidder_status, name FROM users WHERE id = ?`).get(userId) as
    | { bidder_status: string; name: string }
    | undefined;
  if (!before) return;

  db.prepare(`UPDATE users SET bidder_status = ? WHERE id = ?`).run(status, userId);

  if (status === "approved" && before.bidder_status !== "approved") {
    notify(userId, {
      type: "approved",
      title: "Your paddle has been issued",
      body: "Your bidder registration is approved. You can now bid on any open lot.",
      link: "/lots?status=live",
    });
  }

  revalidatePath("/admin/bidders");
  revalidatePath("/admin");
}

export async function setBidLimitAction(userId: number, dollars: number): Promise<void> {
  await requireAdmin();
  const cents = Number.isFinite(dollars) && dollars > 0 ? Math.round(dollars * 100) : 0;
  db.prepare(`UPDATE users SET bid_limit = ? WHERE id = ?`).run(cents, userId);
  revalidatePath("/admin/bidders");
}

/* ── Consignments ───────────────────────────────────────────── */

export async function setConsignmentStatusAction(id: number, status: string): Promise<void> {
  await requireAdmin();
  if (!["new", "reviewing", "accepted", "declined"].includes(status)) return;
  db.prepare(`UPDATE consignments SET status = ? WHERE id = ?`).run(status, id);
  revalidatePath("/admin/consignments");
  revalidatePath("/admin");
}

/* ── Lots ───────────────────────────────────────────────────── */

const lotSchema = z.object({
  auction_id: z.coerce.number().int().positive(),
  lot_no: z.string().min(1, "Enter a lot number."),
  title: z.string().min(3, "Enter a title."),
  year: z.coerce.number().int().min(1885).max(2100).optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  category: z.string().optional(),
  vin: z.string().optional(),
  mileage: z.coerce.number().int().min(0).optional(),
  engine: z.string().optional(),
  transmission: z.string().optional(),
  drivetrain: z.string().optional(),
  exterior: z.string().optional(),
  interior: z.string().optional(),
  location: z.string().optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  highlights: z.string().optional(),
  flaws: z.string().optional(),
  images: z.string().optional(),
  estimate_low: z.coerce.number().min(0).optional(),
  estimate_high: z.coerce.number().min(0).optional(),
  reserve: z.coerce.number().min(0).optional(),
  has_reserve: z.coerce.boolean().optional(),
  starting_bid: z.coerce.number().min(0),
  starts_at: z.string().min(1, "Set an opening time."),
  ends_at: z.string().min(1, "Set a closing time."),
  status: z.string(),
  featured: z.coerce.boolean().optional(),
});

/** Turns a textarea of one-per-line entries into a JSON array column. */
function lines(raw: string | undefined): string {
  if (!raw) return "[]";
  return JSON.stringify(
    raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
  );
}

const usd = (n: number | undefined) => (n == null ? null : Math.round(n * 100));

export async function saveLotAction(
  lotId: number | null,
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData);
  const parsed = lotSchema.safeParse({
    ...raw,
    has_reserve: formData.get("has_reserve") === "on",
    featured: formData.get("featured") === "on",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
    }
    return { fieldErrors };
  }

  const d = parsed.data;
  const startsAt = new Date(d.starts_at).getTime();
  const endsAt = new Date(d.ends_at).getTime();
  if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt))
    return { error: "Those dates could not be read." };
  if (endsAt <= startsAt)
    return { fieldErrors: { ends_at: "Closing time must be after the opening time." } };

  const hasReserve = d.has_reserve ? 1 : 0;
  const reserve = hasReserve ? usd(d.reserve) : null;
  if (hasReserve && (reserve == null || reserve <= 0))
    return { fieldErrors: { reserve: "Set a reserve, or switch the lot to no reserve." } };

  const columns = {
    auction_id: d.auction_id,
    lot_no: d.lot_no,
    title: d.title,
    year: d.year ?? null,
    make: d.make || null,
    model: d.model || null,
    category: d.category || null,
    vin: d.vin || null,
    mileage: d.mileage ?? null,
    engine: d.engine || null,
    transmission: d.transmission || null,
    drivetrain: d.drivetrain || null,
    exterior: d.exterior || null,
    interior: d.interior || null,
    location: d.location || null,
    summary: d.summary || null,
    description: d.description || null,
    highlights: lines(d.highlights),
    flaws: lines(d.flaws),
    images: lines(d.images),
    estimate_low: usd(d.estimate_low),
    estimate_high: usd(d.estimate_high),
    reserve,
    has_reserve: hasReserve,
    starting_bid: usd(d.starting_bid) ?? 0,
    starts_at: startsAt,
    ends_at: endsAt,
    status: d.status,
    featured: d.featured ? 1 : 0,
  };

  let slug: string;

  if (lotId) {
    const existing = db.prepare(`SELECT slug, bid_count FROM lots WHERE id = ?`).get(lotId) as
      | { slug: string; bid_count: number }
      | undefined;
    if (!existing) return { error: "That lot no longer exists." };

    // Moving the floor under live bidding would invalidate bids already placed.
    if (existing.bid_count > 0) {
      const current = db.prepare(`SELECT starting_bid FROM lots WHERE id = ?`).get(lotId) as {
        starting_bid: number;
      };
      if (columns.starting_bid !== current.starting_bid)
        return {
          fieldErrors: {
            starting_bid: "This lot already has bids — the starting bid can no longer be changed.",
          },
        };
    }

    const sets = Object.keys(columns)
      .map((k) => `${k} = ?`)
      .join(", ");
    db.prepare(`UPDATE lots SET ${sets} WHERE id = ?`).run(...Object.values(columns), lotId);
    slug = existing.slug;
  } else {
    slug = `${slugify(d.title)}-${d.lot_no}`;
    const clash = db.prepare(`SELECT 1 FROM lots WHERE slug = ?`).get(slug);
    if (clash) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

    const keys = ["slug", ...Object.keys(columns), "current_bid", "bid_count", "created_at"];
    const placeholders = keys.map(() => "?").join(", ");
    db.prepare(`INSERT INTO lots (${keys.join(", ")}) VALUES (${placeholders})`).run(
      slug,
      ...Object.values(columns),
      0,
      0,
      now(),
    );
  }

  sweep();
  revalidatePath("/admin/lots");
  revalidatePath(`/lots/${slug}`);
  revalidatePath("/lots");
  redirect(`/admin/lots?saved=${encodeURIComponent(slug)}`);
}

export async function deleteLotAction(lotId: number): Promise<void> {
  await requireAdmin();
  const lot = db.prepare(`SELECT bid_count, slug FROM lots WHERE id = ?`).get(lotId) as
    | { bid_count: number; slug: string }
    | undefined;
  if (!lot) return;

  // A lot with bidding history is withdrawn, never erased — the record matters.
  if (lot.bid_count > 0) {
    db.prepare(`UPDATE lots SET status = 'unsold' WHERE id = ?`).run(lotId);
  } else {
    db.prepare(`DELETE FROM lots WHERE id = ?`).run(lotId);
  }

  revalidatePath("/admin/lots");
  revalidatePath("/lots");
}

/** Closes a lot early, settling it exactly as the clock would have. */
export async function closeLotNowAction(lotId: number): Promise<void> {
  await requireAdmin();
  db.prepare(`UPDATE lots SET ends_at = ? WHERE id = ? AND status IN ('live','scheduled')`).run(
    now() - 1,
    lotId,
  );
  sweep();
  revalidatePath("/admin/lots");
  revalidatePath("/admin");
}

/** Pushes a lot's close time out, for when a sale runs long. */
export async function extendLotAction(lotId: number, minutes: number): Promise<void> {
  await requireAdmin();
  const lot = db.prepare(`SELECT ends_at FROM lots WHERE id = ?`).get(lotId) as
    | { ends_at: number }
    | undefined;
  if (!lot) return;
  const base = Math.max(lot.ends_at, now());
  db.prepare(`UPDATE lots SET ends_at = ?, status = 'live' WHERE id = ?`).run(
    base + minutes * 60_000,
    lotId,
  );
  revalidatePath("/admin/lots");
  revalidatePath("/admin");
}

export async function setInvoiceStatusAction(invoiceId: number, status: string): Promise<void> {
  await requireAdmin();
  if (!["due", "paid", "void"].includes(status)) return;
  db.prepare(`UPDATE invoices SET status = ? WHERE id = ?`).run(status, invoiceId);
  revalidatePath("/admin/invoices");
}
