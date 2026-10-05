"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { loginAction, registerAction, type FormState } from "@/app/actions/auth";
import { TextField } from "./field";

const initial: FormState = {};

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(loginAction, initial);
  const e = state.fieldErrors ?? {};

  return (
    <form action={action}>
      {next && <input type="hidden" name="next" value={next} />}

      {state.error && (
        <p
          role="alert"
          className="mb-5 flex items-start gap-2 rounded-sm bg-brand-50 px-3.5 py-3 text-[13px] leading-relaxed text-brand-600"
        >
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {state.error}
        </p>
      )}

      <div className="grid gap-5">
        <TextField
          label="Email"
          name="email"
          type="email"
          required
          error={e.email}
          autoComplete="email"
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          required
          error={e.password}
          autoComplete="current-password"
        />
      </div>

      <Submit label="Sign In" pendingLabel="Signing in" />

      <p className="mt-5 text-center text-[14px] text-ink-400">
        No account?{" "}
        <Link href="/register" className="text-brand-500 underline">
          Register to bid
        </Link>
      </p>

      <DemoAccounts />
    </form>
  );
}

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, initial);
  const e = state.fieldErrors ?? {};

  return (
    <form action={action}>
      {state.error && (
        <p
          role="alert"
          className="mb-5 flex items-start gap-2 rounded-sm bg-brand-50 px-3.5 py-3 text-[13px] text-brand-600"
        >
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {state.error}
        </p>
      )}

      <div className="grid gap-5">
        <TextField label="Full name" name="name" required error={e.name} autoComplete="name" />
        <TextField
          label="Email"
          name="email"
          type="email"
          required
          error={e.email}
          autoComplete="email"
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Phone" name="phone" type="tel" error={e.phone} autoComplete="tel" />
          <TextField
            label="Brokerage / company"
            name="company"
            error={e.company}
            autoComplete="organization"
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Password"
            name="password"
            type="password"
            required
            error={e.password}
            hint="At least 8 characters"
            autoComplete="new-password"
          />
          <TextField
            label="Confirm password"
            name="confirm"
            type="password"
            required
            error={e.confirm}
            autoComplete="new-password"
          />
        </div>
      </div>

      <Submit label="Create Account" pendingLabel="Creating account" />

      <p className="mt-4 text-[12px] leading-relaxed text-ink-400">
        Registrations are reviewed by a person, usually within one business day. You can browse,
        watch lots and ask questions straight away — bidding opens once your paddle is issued.
      </p>

      <p className="mt-5 text-center text-[14px] text-ink-400">
        Already registered?{" "}
        <Link href="/login" className="text-brand-500 underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary btn-lg mt-6 w-full" disabled={pending}>
      {pending && <Loader2 size={16} className="animate-spin" />}
      {pending ? pendingLabel : label}
    </button>
  );
}

/** Demo credentials, so the pitch audience can get straight in. */
function DemoAccounts() {
  return (
    <div className="mt-7 rounded-sm border border-ink-100 bg-ink-50 p-4">
      <p className="label mb-2.5">Demo accounts</p>
      <dl className="space-y-1.5 text-[12px]">
        {[
          ["Approved bidder", "broker@demo.com", "demo1234"],
          ["Pending bidder", "pending@demo.com", "demo1234"],
          ["Administrator", "admin@noreserveclassics.com", "admin1234"],
        ].map(([role, email, password]) => (
          <div key={email} className="flex flex-wrap justify-between gap-2">
            <dt className="text-ink-400">{role}</dt>
            <dd className="num font-medium">
              {email} / {password}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
