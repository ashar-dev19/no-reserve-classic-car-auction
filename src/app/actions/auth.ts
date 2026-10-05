"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createSession,
  createUser,
  destroySession,
  findUserByEmail,
  verifyPassword,
} from "@/lib/auth";

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
}

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };

  const user = findUserByEmail(parsed.data.email);
  // One message for both cases, so the form cannot be used to enumerate accounts.
  if (!user || !verifyPassword(parsed.data.password, user.password_hash))
    return { error: "That email and password do not match an account." };

  await createSession(user.id, user.role);
  redirect(typeof formData.get("next") === "string" && formData.get("next")
    ? String(formData.get("next"))
    : user.role === "admin"
      ? "/admin"
      : "/dashboard");
}

const registerSchema = z
  .object({
    name: z.string().min(2, "Enter your full name."),
    email: z.string().email("Enter a valid email address."),
    password: z.string().min(8, "Use at least 8 characters."),
    confirm: z.string(),
    phone: z.string().optional(),
    company: z.string().optional(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords do not match.",
  });

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
    phone: formData.get("phone"),
    company: formData.get("company"),
  });
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };

  if (findUserByEmail(parsed.data.email))
    return { fieldErrors: { email: "An account already uses that email address." } };

  const user = createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    name: parsed.data.name,
    phone: parsed.data.phone || undefined,
    company: parsed.data.company || undefined,
  });

  await createSession(user.id, user.role);
  redirect("/dashboard?welcome=1");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

function flatten(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
