"use server";

import { z } from "zod";
import { db, now } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getAuctionBySlug } from "@/lib/queries";

export interface SubmitState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

const consignSchema = z.object({
  name: z.string().min(2, "Enter your name."),
  email: z.string().email("Enter a valid email address."),
  phone: z.string().optional(),
  year: z.coerce.number().int().min(1885).max(2100),
  make: z.string().min(1, "Enter the make."),
  model: z.string().min(1, "Enter the model."),
  mileage: z.coerce.number().int().min(0).optional(),
  reserve_pref: z.string().optional(),
  notes: z.string().max(4000).optional(),
});

export async function consignAction(_prev: SubmitState, formData: FormData): Promise<SubmitState> {
  const parsed = consignSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };

  const user = await getCurrentUser();
  const d = parsed.data;

  db.prepare(
    `INSERT INTO consignments (user_id, name, email, phone, year, make, model, mileage,
                               reserve_pref, notes, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)`,
  ).run(
    user?.id ?? null,
    d.name,
    d.email,
    d.phone ?? null,
    d.year,
    d.make,
    d.model,
    d.mileage ?? null,
    d.reserve_pref ?? null,
    d.notes ?? null,
    now(),
  );

  return { ok: true };
}

const rsvpSchema = z.object({
  name: z.string().min(2, "Enter your name."),
  email: z.string().email("Enter a valid email address."),
  phone: z.string().optional(),
  brokerage: z.string().optional(),
  guests: z.coerce.number().int().min(0).max(10).default(0),
  intent: z.string().optional(),
});

export async function rsvpAction(_prev: SubmitState, formData: FormData): Promise<SubmitState> {
  const parsed = rsvpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };

  const auction = getAuctionBySlug("hamptons-collector-sale");
  const d = parsed.data;

  const duplicate = db
    .prepare(`SELECT id FROM rsvps WHERE email = ? AND auction_id IS ?`)
    .get(d.email, auction?.id ?? null);
  if (duplicate) return { ok: true }; // idempotent; a second RSVP is not an error

  db.prepare(
    `INSERT INTO rsvps (auction_id, name, email, phone, brokerage, guests, intent, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    auction?.id ?? null,
    d.name,
    d.email,
    d.phone ?? null,
    d.brokerage ?? null,
    d.guests,
    d.intent ?? null,
    now(),
  );

  return { ok: true };
}

function flatten(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
