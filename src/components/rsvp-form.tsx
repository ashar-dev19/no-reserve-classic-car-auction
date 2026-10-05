"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { rsvpAction, type SubmitState } from "@/app/actions/forms";
import { SelectField, TextField } from "./field";

const initial: SubmitState = {};

export function RsvpForm() {
  const [state, action] = useActionState(rsvpAction, initial);

  if (state.ok) {
    return (
      <div className="card slide-up bg-white p-8 text-center text-ink-900">
        <CheckCircle2 size={30} className="mx-auto text-gain" />
        <h3 className="mt-4 text-[22px]">You're on the list</h3>
        <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-ink-500">
          Your invitation and paddle details will arrive by email within 24 hours. Preview opens
          Friday at 9:00 AM at the Bridgehampton Historical Society.
        </p>
        <a href="/auctions/hamptons-collector-sale" className="btn btn-dark mt-6">
          View the catalogue
        </a>
      </div>
    );
  }

  const e = state.fieldErrors ?? {};

  return (
    <form action={action} className="card bg-white p-6 text-ink-900 sm:p-7">
      <h3 className="text-[22px] leading-tight">Reserve your paddle</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-400">
        Attendance is by invitation. Registration is free and includes Friday preview, Saturday
        reception and floor bidding privileges.
      </p>

      <div className="mt-5 grid gap-4">
        <TextField label="Full name" name="name" required error={e.name} autoComplete="name" />
        <TextField
          label="Email"
          name="email"
          type="email"
          required
          error={e.email}
          autoComplete="email"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Phone" name="phone" type="tel" error={e.phone} autoComplete="tel" />
          <TextField
            label="Brokerage / firm"
            name="brokerage"
            error={e.brokerage}
            autoComplete="organization"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="I plan to"
            name="intent"
            error={e.intent}
            options={[
              ["bidding", "Bid on lots"],
              ["attending", "Attend only"],
              ["consigning", "Consign a vehicle"],
            ]}
          />
          <SelectField
            label="Guests"
            name="guests"
            error={e.guests}
            options={[
              ["0", "Just me"],
              ["1", "+1 guest"],
              ["2", "+2 guests"],
              ["3", "+3 guests"],
            ]}
          />
        </div>
      </div>

      <Submit />

      <p className="mt-3 text-center text-[12px] text-ink-400">
        We will only contact you about this event and our sales calendar.
      </p>
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary mt-5 w-full" disabled={pending}>
      {pending && <Loader2 size={16} className="animate-spin" />}
      {pending ? "Reserving" : "Reserve My Paddle"}
    </button>
  );
}
