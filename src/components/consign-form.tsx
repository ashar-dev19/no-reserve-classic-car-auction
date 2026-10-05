"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { consignAction, type SubmitState } from "@/app/actions/forms";
import { SelectField, TextArea, TextField } from "./field";

const initial: SubmitState = {};

export function ConsignForm() {
  const [state, action] = useActionState(consignAction, initial);

  if (state.ok) {
    return (
      <div className="card slide-up p-8 text-center">
        <CheckCircle2 size={30} className="mx-auto text-gain" />
        <h2 className="mt-4 text-[24px]">Submission received</h2>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink-500">
          A specialist will be in touch within one business day to discuss estimate, reserve and
          which sale suits the car. If it is a fit, we will arrange inspection and photography at
          our expense.
        </p>
        <a href="/sell" className="btn btn-outline mt-6">
          Submit another vehicle
        </a>
      </div>
    );
  }

  const e = state.fieldErrors ?? {};

  return (
    <form action={action} className="card p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Your name" name="name" required error={e.name} autoComplete="name" />
        <TextField
          label="Email"
          name="email"
          type="email"
          required
          error={e.email}
          autoComplete="email"
        />
        <TextField
          label="Phone"
          name="phone"
          type="tel"
          error={e.phone}
          autoComplete="tel"
          placeholder="(800) 562-7815"
        />
        <SelectField
          label="Reserve preference"
          name="reserve_pref"
          error={e.reserve_pref}
          options={[
            ["reserve", "I would like a reserve"],
            ["no-reserve", "Offer at no reserve"],
            ["undecided", "Undecided — advise me"],
          ]}
        />
      </div>

      <div className="mt-6 border-t border-ink-100 pt-6">
        <h3 className="mb-4 text-[18px]">The vehicle</h3>
        <div className="grid gap-5 sm:grid-cols-4">
          <TextField
            label="Year"
            name="year"
            inputMode="numeric"
            required
            error={e.year}
            placeholder="1970"
          />
          <TextField label="Make" name="make" required error={e.make} placeholder="Ford" />
          <TextField
            label="Model"
            name="model"
            required
            error={e.model}
            placeholder="Mustang Boss 302"
          />
          <TextField
            label="Mileage"
            name="mileage"
            inputMode="numeric"
            error={e.mileage}
            placeholder="62410"
          />
        </div>

        <div className="mt-5">
          <TextArea
            label="Tell us about the car"
            name="notes"
            rows={5}
            error={e.notes}
            hint="History, ownership, restoration work, documentation, and anything a buyer would want to know — including the flaws."
            placeholder="Two owners from new, rotisserie restoration completed in 2019, Marti Report on file…"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-ink-100 pt-6">
        <p className="max-w-md text-[12px] leading-relaxed text-ink-400">
          No listing fee and no charge if the lot does not sell. Seller's commission is 5% of the
          hammer price, capped at $7,500.
        </p>
        <Submit />
      </div>
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary btn-lg" disabled={pending}>
      {pending && <Loader2 size={16} className="animate-spin" />}
      {pending ? "Submitting" : "Submit Vehicle"}
    </button>
  );
}
