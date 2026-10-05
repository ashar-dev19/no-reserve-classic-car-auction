import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth-forms";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign In" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (await getCurrentUser()) redirect("/dashboard");
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;

  return (
    <div className="grid lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-16 sm:px-8">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-8 inline-flex items-center"
            aria-label="No Reserve Classics home"
          >
            <Image
              src="/brand/nrc-logo.png"
              alt="No Reserve Classics"
              width={300}
              height={38}
              priority
              className="h-[30px] w-auto"
            />
          </Link>

          <h1 className="text-[32px] leading-tight">Sign in</h1>
          <p className="mt-2 mb-7 text-[15px] text-ink-400">
            Welcome back. Your paddle carries across every sale.
          </p>

          <LoginForm next={next} />
        </div>
      </div>

      <div className="relative hidden lg:block">
        <Image
          src="/cars/ferrari-250.jpg"
          alt=""
          fill
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 to-ink-950/20" />
        <blockquote className="absolute bottom-10 left-10 right-10 text-white">
          <p className="display text-[26px] leading-tight">
            &ldquo;The condition reports are the most honest in the business. They tell you what is
            wrong with the car before you ask.&rdquo;
          </p>
          <footer className="mt-4 text-[13px] text-ink-300">
            Marcus Calloway · Collector, Sagaponack
          </footer>
        </blockquote>
      </div>
    </div>
  );
}
