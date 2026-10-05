"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { saveLotAction, type AdminState } from "@/app/actions/admin";
import { SelectField, TextArea, TextField } from "./field";
import type { LotView } from "@/lib/types";

const initial: AdminState = {};

/** `datetime-local` wants a local-time string with no zone suffix. */
function toLocalInput(ms: number): string {
  const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60_000);
  return d.toISOString().slice(0, 16);
}

const dollars = (cents: number | null | undefined) =>
  cents == null ? "" : String(Math.round(cents / 100));

export function AdminLotForm({
  lot,
  auctions,
  imageChoices,
}: {
  lot: LotView | null;
  auctions: Array<{ id: number; title: string }>;
  imageChoices: string[];
}) {
  const action = saveLotAction.bind(null, lot?.id ?? null);
  const [state, formAction] = useActionState(action, initial);
  const [hasReserve, setHasReserve] = useState(lot ? lot.has_reserve === 1 : true);
  const e = state.fieldErrors ?? {};

  const now = Date.now();

  return (
    <form action={formAction} className="space-y-8">
      {state.error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-sm bg-brand-50 px-4 py-3 text-[14px] text-brand-600"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {state.error}
        </p>
      )}

      {/* Catalogue */}
      <section className="card p-6">
        <h2 className="mb-5 text-[20px]">Catalogue entry</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            label="Auction"
            name="auction_id"
            required
            error={e.auction_id}
            defaultValue={String(lot?.auction_id ?? auctions[0]?.id ?? "")}
            options={auctions.map((a) => [String(a.id), a.title])}
          />
          <TextField
            label="Lot number"
            name="lot_no"
            required
            error={e.lot_no}
            defaultValue={lot?.lot_no}
            placeholder="010"
          />
        </div>

        <div className="mt-5">
          <TextField
            label="Title"
            name="title"
            required
            error={e.title}
            defaultValue={lot?.title}
            placeholder="1970 Ford Mustang Boss 302"
          />
        </div>

        <div className="mt-5">
          <TextArea
            label="Summary"
            name="summary"
            rows={2}
            error={e.summary}
            defaultValue={lot?.summary ?? ""}
            hint="One or two sentences. Shown on cards and in search results."
          />
        </div>

        <div className="mt-5">
          <TextArea
            label="Description"
            name="description"
            rows={8}
            error={e.description}
            defaultValue={lot?.description ?? ""}
            hint="Separate paragraphs with a blank line."
          />
        </div>
      </section>

      {/* Vehicle */}
      <section className="card p-6">
        <h2 className="mb-5 text-[20px]">Vehicle</h2>
        <div className="grid gap-5 sm:grid-cols-4">
          <TextField label="Year" name="year" inputMode="numeric" error={e.year} defaultValue={lot?.year ?? ""} />
          <TextField label="Make" name="make" error={e.make} defaultValue={lot?.make ?? ""} />
          <TextField label="Model" name="model" error={e.model} defaultValue={lot?.model ?? ""} />
          <TextField
            label="Category"
            name="category"
            error={e.category}
            defaultValue={lot?.category ?? ""}
            placeholder="Classic"
          />
          <TextField label="VIN" name="vin" error={e.vin} defaultValue={lot?.vin ?? ""} />
          <TextField
            label="Mileage"
            name="mileage"
            inputMode="numeric"
            error={e.mileage}
            defaultValue={lot?.mileage ?? ""}
          />
          <TextField label="Engine" name="engine" error={e.engine} defaultValue={lot?.engine ?? ""} />
          <TextField
            label="Transmission"
            name="transmission"
            error={e.transmission}
            defaultValue={lot?.transmission ?? ""}
          />
          <TextField
            label="Drivetrain"
            name="drivetrain"
            error={e.drivetrain}
            defaultValue={lot?.drivetrain ?? ""}
          />
          <TextField
            label="Exterior"
            name="exterior"
            error={e.exterior}
            defaultValue={lot?.exterior ?? ""}
          />
          <TextField
            label="Interior"
            name="interior"
            error={e.interior}
            defaultValue={lot?.interior ?? ""}
          />
          <TextField
            label="Location"
            name="location"
            error={e.location}
            defaultValue={lot?.location ?? ""}
          />
        </div>
      </section>

      {/* Condition */}
      <section className="card p-6">
        <h2 className="mb-1 text-[20px]">Condition report</h2>
        <p className="mb-5 text-[13px] text-ink-400">One entry per line.</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextArea
            label="Highlights"
            name="highlights"
            rows={6}
            error={e.highlights}
            defaultValue={lot?.highlights.join("\n") ?? ""}
            placeholder={"Numbers-matching engine\nRotisserie restoration completed 2019"}
          />
          <TextArea
            label="Known flaws"
            name="flaws"
            rows={6}
            error={e.flaws}
            defaultValue={lot?.flaws.join("\n") ?? ""}
            placeholder={"Minor orange peel in the driver's door paint\nReproduction exhaust tips"}
          />
        </div>
      </section>

      {/* Images */}
      <section className="card p-6">
        <h2 className="mb-1 text-[20px]">Images</h2>
        <p className="mb-5 text-[13px] text-ink-400">
          One path per line. The first is the cover image.
        </p>
        <TextArea
          label="Image paths"
          name="images"
          rows={5}
          error={e.images}
          defaultValue={lot?.images.join("\n") ?? ""}
          placeholder="/cars/mustang-boss.jpg"
        />
        <details className="mt-4">
          <summary className="cursor-pointer text-[13px] text-brand-500">
            Show available images ({imageChoices.length})
          </summary>
          <div className="num mt-3 grid max-h-48 gap-1 overflow-y-auto rounded-sm border border-ink-100 bg-ink-50 p-3 text-[12px] text-ink-500 sm:grid-cols-3">
            {imageChoices.map((src) => (
              <code key={src}>{src}</code>
            ))}
          </div>
        </details>
      </section>

      {/* Money and clock */}
      <section className="card p-6">
        <h2 className="mb-5 text-[20px]">Estimate, reserve and clock</h2>

        <div className="grid gap-5 sm:grid-cols-3">
          <TextField
            label="Estimate low ($)"
            name="estimate_low"
            inputMode="numeric"
            error={e.estimate_low}
            defaultValue={dollars(lot?.estimate_low)}
          />
          <TextField
            label="Estimate high ($)"
            name="estimate_high"
            inputMode="numeric"
            error={e.estimate_high}
            defaultValue={dollars(lot?.estimate_high)}
          />
          <TextField
            label="Starting bid ($)"
            name="starting_bid"
            inputMode="numeric"
            required
            error={e.starting_bid}
            defaultValue={dollars(lot?.starting_bid) || "1000"}
            hint={lot && lot.bid_count > 0 ? "Locked — this lot already has bids." : undefined}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-5">
          <label className="flex h-11 cursor-pointer items-center gap-2.5 text-[14px]">
            <input
              type="checkbox"
              name="has_reserve"
              checked={hasReserve}
              onChange={(ev) => setHasReserve(ev.target.checked)}
              className="h-4 w-4 accent-[#f90000]"
            />
            This lot has a reserve
          </label>

          {hasReserve && (
            <div className="w-56">
              <TextField
                label="Reserve ($)"
                name="reserve"
                inputMode="numeric"
                error={e.reserve}
                defaultValue={dollars(lot?.reserve)}
              />
            </div>
          )}

          <label className="flex h-11 cursor-pointer items-center gap-2.5 text-[14px]">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={lot?.featured === 1}
              className="h-4 w-4 accent-[#f90000]"
            />
            Feature on the homepage
          </label>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="starts_at" className="label">
              Bidding opens <span className="text-brand-500">*</span>
            </label>
            <input
              id="starts_at"
              name="starts_at"
              type="datetime-local"
              required
              className="field"
              defaultValue={toLocalInput(lot?.starts_at ?? now)}
            />
            {e.starts_at && <p className="mt-1.5 text-[12px] text-brand-600">{e.starts_at}</p>}
          </div>

          <div>
            <label htmlFor="ends_at" className="label">
              Bidding closes <span className="text-brand-500">*</span>
            </label>
            <input
              id="ends_at"
              name="ends_at"
              type="datetime-local"
              required
              className="field"
              defaultValue={toLocalInput(lot?.ends_at ?? now + 7 * 86_400_000)}
            />
            {e.ends_at && <p className="mt-1.5 text-[12px] text-brand-600">{e.ends_at}</p>}
          </div>

          <SelectField
            label="Status"
            name="status"
            error={e.status}
            defaultValue={lot?.status ?? "scheduled"}
            options={[
              ["draft", "Draft — hidden from the public site"],
              ["scheduled", "Scheduled — opens at the time above"],
              ["live", "Live — bidding open"],
              ["sold", "Sold"],
              ["unsold", "Not sold"],
            ]}
          />
        </div>

        <p className="mt-4 text-[12px] leading-relaxed text-ink-400">
          Every lot closes on a two-minute soft close: a bid inside the final two minutes pushes the
          closing time back out automatically.
        </p>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink-100 pt-6">
        <Link href="/admin/lots" className="btn btn-outline">
          Cancel
        </Link>
        <Submit isNew={!lot} />
      </div>
    </form>
  );
}

function Submit({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary btn-lg" disabled={pending}>
      {pending && <Loader2 size={16} className="animate-spin" />}
      {pending ? "Saving" : isNew ? "Create Lot" : "Save Changes"}
    </button>
  );
}
