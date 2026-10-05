import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth-forms";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Register to Bid" };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/dashboard");

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

          <h1 className="text-[32px] leading-tight">Register to bid</h1>
          <p className="mt-2 mb-7 text-[15px] text-ink-400">
            Free, and good for every sale we run.
          </p>

          <RegisterForm />
        </div>
      </div>

      <div className="relative hidden lg:block">
        <Image src="/cars/aston-vanquish.jpg" alt="" fill sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 to-ink-950/20" />
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <p className="eyebrow">What registration gets you</p>
          <ul className="mt-4 space-y-2.5 text-[15px]">
            {[
              "Bid online, by telephone or from the floor",
              "Full condition reports and history files",
              "Outbid alerts and watchlist notifications",
              "Invitations to our live East End sales",
            ].map((item) => (
              <li key={item} className="flex gap-2.5">
                <span className="text-brand-500">&mdash;</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
