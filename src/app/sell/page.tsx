import Image from "next/image";
import type { Metadata } from "next";
import { Camera, FileCheck2, Megaphone, Truck } from "lucide-react";
import { ConsignForm } from "@/components/consign-form";
import { platformStats } from "@/lib/queries";
import { compactMoney } from "@/lib/format";

export const metadata: Metadata = {
  title: "Sell or Consign",
  description:
    "Flat 5% seller's commission capped at $7,500. No listing fee, no charge if the lot does not sell.",
};

const STEPS: Array<[typeof Camera, string, string]> = [
  [
    FileCheck2,
    "Submit the car",
    "Tell us what you have. A specialist responds within one business day with an estimate range and a view on which sale suits it.",
  ],
  [
    Camera,
    "We inspect and photograph",
    "Our inspector spends half a day with the car and writes the condition report — including the flaws. Photography is ours, at our expense.",
  ],
  [
    Megaphone,
    "The lot goes to market",
    "Catalogued, published and marketed to our registered bidders, plus the invitation list for the sale it is entered in.",
  ],
  [
    Truck,
    "Settlement and transport",
    "Funds clear within five business days of the hammer. Enclosed transport and title transfer handled in-house.",
  ],
];

export default function SellPage() {
  const stats = platformStats();

  return (
    <>
      <header className="relative isolate overflow-hidden bg-ink-900 text-white">
        <Image
          src="/cars/workshop.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-ink-950/80" />
        <div className="wrap relative py-16">
          <p className="eyebrow">Sell With Us</p>
          <h1 className="mt-3 max-w-3xl text-[40px] leading-[1.05] sm:text-[52px]">
            Your car deserves the right room
          </h1>
          <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-ink-200">
            We take a small number of consignments per sale and put real work into each one. Flat 5%
            seller's commission capped at $7,500, no listing fee, and nothing owed if the lot does
            not sell.
          </p>

          <dl className="mt-10 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-6 border-t border-white/15 pt-8 sm:grid-cols-4">
            {[
              ["Sell-through", `${stats.sellThroughPct}%`],
              ["Hammer total", compactMoney(stats.hammerTotal)],
              ["Registered bidders", String(stats.registeredBidders)],
              ["Seller's commission", "5%"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[11px] uppercase tracking-[0.12em] text-ink-300">{label}</dt>
                <dd className="num display mt-1 text-[26px] font-bold leading-none">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <section className="wrap py-16">
        <div className="border-b border-ink-100 pb-5">
          <p className="eyebrow">The Process</p>
          <h2 className="mt-2 text-[32px] leading-tight">Four steps, about three weeks</h2>
        </div>

        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([Icon, title, body], i) => (
            <li key={title} className="card p-6">
              <div className="flex items-center justify-between">
                <Icon size={20} className="text-brand-500" strokeWidth={1.8} />
                <span className="num display text-[28px] font-bold leading-none text-ink-100">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-4 text-[18px] leading-snug">{title}</h3>
              <p className="mt-2.5 text-[13px] leading-relaxed text-ink-400">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-ink-100 bg-ink-50">
        <div className="wrap grid gap-10 py-16 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow">Submit a Vehicle</p>
            <h2 className="mt-2 text-[32px] leading-tight">Tell us what you have</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-500">
              The more detail you give us now, the faster we can come back with a realistic estimate.
              Photographs are not required at this stage — we take our own.
            </p>

            <dl className="mt-8 space-y-5">
              {[
                ["Seller's commission", "5% of hammer, capped at $7,500"],
                ["Listing fee", "None"],
                ["If the lot does not sell", "No charge"],
                ["Photography & inspection", "Included"],
                ["Typical time to sale", "3–5 weeks from acceptance"],
              ].map(([term, value]) => (
                <div key={term} className="flex justify-between gap-4 border-b border-ink-150 pb-3">
                  <dt className="text-[13px] uppercase tracking-[0.06em] text-ink-400">{term}</dt>
                  <dd className="text-right text-[14px] font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <ConsignForm />
        </div>
      </section>
    </>
  );
}
