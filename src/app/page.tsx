import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Timer, FileSearch, Truck } from "lucide-react";
import { LotCard } from "@/components/lot-card";
import { toCardData } from "@/lib/lot-card-data";
import { Countdown } from "@/components/countdown";
import { SectionHeading } from "@/components/section-heading";
import {
  endingSoon,
  featuredLots,
  getAuctions,
  platformStats,
  recentResults,
  auctionLotStats,
} from "@/lib/queries";
import { compactMoney, dateOnly, money, numberFmt } from "@/lib/format";

export default function HomePage() {
  const stats = platformStats();
  const featured = featuredLots(6);
  const closing = endingSoon(4);
  const results = recentResults(3);
  const auctions = getAuctions().filter((a) => a.status !== "ended").slice(0, 3);
  const flagship = auctions.find((a) => a.slug === "hamptons-collector-sale") ?? auctions[0];
  const headline = featured[0];

  return (
    <>
      {/* ───────────── Hero ───────────── */}
      <section className="relative isolate overflow-hidden bg-ink-900 text-white">
        <Image
          src="/cars/hero-wide.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/95 via-ink-950/70 to-ink-950/25" />

        <div className="wrap relative grid gap-12 py-20 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:py-28">
          <div>
            {flagship && (
              <p className="eyebrow mb-4 flex items-center gap-2">
                {flagship.status === "live" && <i className="pulse-dot" />}
                {flagship.status === "live" ? "Bidding open now" : "Catalogue open"} ·{" "}
                {flagship.subtitle}
              </p>
            )}
            <h1 className="text-[44px] leading-[1.03] sm:text-[60px] lg:text-[68px]">
              The modern way
              <br />
              to buy a collector car
            </h1>
            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-ink-200">
              Every lot inspected, photographed and documented — flaws included. Proxy bidding so
              you never have to sit on the page, and a two-minute soft close so the last second
              never decides the car.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/lots?status=live" className="btn btn-primary btn-lg">
                View Live Lots <ArrowRight size={16} />
              </Link>
              <Link href="/sell" className="btn btn-ghost-light btn-lg">
                Sell or Consign
              </Link>
            </div>

            <dl className="mt-12 grid max-w-xl grid-cols-2 gap-x-8 gap-y-6 border-t border-white/15 pt-8 sm:grid-cols-4">
              {[
                ["Lots live now", numberFmt(stats.liveNow)],
                ["Hammer total", compactMoney(stats.hammerTotal)],
                ["Sell-through", `${stats.sellThroughPct}%`],
                ["Registered bidders", numberFmt(stats.registeredBidders)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[11px] uppercase tracking-[0.12em] text-ink-300">{label}</dt>
                  <dd className="num display mt-1 text-[26px] font-bold leading-none">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Headline lot */}
          {headline && (
            <div className="rounded-md bg-white p-5 text-ink-900 shadow-[0_30px_80px_-30px_rgba(0,0,0,.8)]">
              <div className="flex items-center justify-between">
                <span className="eyebrow">Featured Lot {headline.lot_no}</span>
                {headline.status === "live" && (
                  <span className="badge badge-live">
                    <i className="pulse-dot" /> Live
                  </span>
                )}
              </div>

              <Link href={`/lots/${headline.slug}`} className="mt-3 block">
                <div className="relative aspect-[16/10] overflow-hidden rounded-sm img-ph">
                  <Image
                    src={headline.images[0] ?? "/cars/hero-wide.jpg"}
                    alt={headline.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 480px"
                    className="object-cover"
                  />
                </div>
                <h2 className="mt-4 text-[24px] leading-tight transition-colors hover:text-brand-500">
                  {headline.title}
                </h2>
              </Link>

              <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink-400">
                {headline.summary}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-ink-100 pt-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.1em] text-ink-400">Current bid</p>
                  <p className="num display text-[26px] font-bold leading-tight">
                    {money(headline.current_bid || headline.starting_bid)}
                  </p>
                  <p className="mt-0.5 text-[12px] text-ink-400">{headline.bid_count} bids</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.1em] text-ink-400">Time left</p>
                  <Countdown
                    endsAt={headline.ends_at}
                    className="display block text-[26px] font-bold leading-tight"
                  />
                  <p className="mt-0.5 text-[12px] text-ink-400">
                    {headline.has_reserve ? (headline.reserve_met ? "Reserve met" : "Reserve not met") : "No reserve"}
                  </p>
                </div>
              </div>

              <Link href={`/lots/${headline.slug}`} className="btn btn-dark mt-5 w-full">
                View Lot &amp; Bid
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ───────────── Trust strip ───────────── */}
      <section className="border-b border-ink-100 bg-ink-50">
        <div className="wrap grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [FileSearch, "Published condition reports", "Every lot documented in full — including the flaws, photographed."],
            [Timer, "Two-minute soft close", "A late bid resets the clock, so sniping never decides a lot."],
            [ShieldCheck, "Vetted bidders only", "Registration reviewed before a paddle is issued."],
            [Truck, "Enclosed transport", "Nationwide delivery and indoor storage arranged in-house."],
          ].map(([Icon, title, body]) => {
            const I = Icon as typeof FileSearch;
            return (
              <div key={title as string} className="flex gap-3.5">
                <I size={20} className="mt-0.5 shrink-0 text-brand-500" strokeWidth={1.8} />
                <div>
                  <h3 className="text-[15px]">{title as string}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-400">{body as string}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ───────────── Closing soon ───────────── */}
      {closing.length > 0 && (
        <section className="wrap py-16">
          <SectionHeading
            eyebrow="Closing Soon"
            title="Lots on the clock"
            action={{ href: "/lots?status=live&sort=ending", label: "All live lots" }}
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {closing.map((lot, i) => (
              <LotCard key={lot.id} lot={toCardData(lot)} priority={i < 2} />
            ))}
          </div>
        </section>
      )}

      {/* ───────────── Hamptons event ───────────── */}
      {flagship && (
        <section className="relative isolate overflow-hidden bg-ink-900 text-white">
          <Image
            src="/cars/field-classics.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-ink-950/75" />
          <div className="wrap relative grid gap-10 py-16 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-2xl">
              <p className="eyebrow">The Flagship Sale</p>
              <h2 className="mt-3 text-[36px] leading-tight sm:text-[44px]">{flagship.title}</h2>
              <p className="mt-2 text-[15px] text-ink-200">{flagship.subtitle}</p>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink-300">
                Three days on the East End, 1,200 invited brokers and collectors, and a catalogue
                assembled specifically for this room. Preview Friday, bidding closes lot by lot
                through Monday evening.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/event" className="btn btn-primary">
                  Reserve Your Paddle
                </Link>
                <Link href={`/auctions/${flagship.slug}`} className="btn btn-ghost-light">
                  View the Catalogue
                </Link>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-10 gap-y-6 border-t border-white/15 pt-7 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              {(() => {
                const s = auctionLotStats(flagship.id);
                return [
                  ["Lots catalogued", String(s.total)],
                  ["Preview opens", dateOnly(flagship.starts_at)],
                  ["Bidding closes", dateOnly(flagship.ends_at)],
                  ["Buyer's premium", `${flagship.buyers_premium_bps / 100}%`],
                ] as Array<[string, string]>;
              })().map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[11px] uppercase tracking-[0.12em] text-ink-300">{label}</dt>
                  <dd className="display mt-1 text-[18px] font-bold leading-tight">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* ───────────── Featured ───────────── */}
      <section className="wrap py-16">
        <SectionHeading
          eyebrow="Selected Lots"
          title="From the current catalogue"
          action={{ href: "/lots", label: "Browse all lots" }}
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((lot) => (
            <LotCard key={lot.id} lot={toCardData(lot)} />
          ))}
        </div>
      </section>

      {/* ───────────── Auctions ───────────── */}
      <section className="border-y border-ink-100 bg-ink-50">
        <div className="wrap py-16">
          <SectionHeading
            eyebrow="Sales Calendar"
            title="Upcoming auctions"
            action={{ href: "/auctions", label: "Full calendar" }}
          />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {auctions.map((a) => {
              const s = auctionLotStats(a.id);
              return (
                <Link
                  key={a.id}
                  href={`/auctions/${a.slug}`}
                  className="card card-hover group overflow-hidden bg-white"
                >
                  <div className="relative aspect-[16/9] img-ph">
                    <Image
                      src={a.hero_image ?? "/cars/hero-wide.jpg"}
                      alt={a.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                    <span
                      className={`badge absolute left-3 top-3 ${
                        a.status === "live" ? "badge-live" : "badge-soon"
                      }`}
                    >
                      {a.status === "live" && <i className="pulse-dot" />}
                      {a.status === "live" ? "Live" : "Scheduled"}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="text-[19px] leading-tight transition-colors group-hover:text-brand-500">
                      {a.title}
                    </h3>
                    <p className="mt-1.5 text-[13px] text-ink-400">{a.subtitle}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3 text-[12px] text-ink-400">
                      <span>{s.total} lots</span>
                      <span>{dateOnly(a.starts_at)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────── Results ───────────── */}
      {results.length > 0 && (
        <section className="wrap py-16">
          <SectionHeading
            eyebrow="Recent Results"
            title="Sold at No Reserve Classics"
            action={{ href: "/results", label: "All results" }}
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((lot) => (
              <Link
                key={lot.id}
                href={`/lots/${lot.slug}`}
                className="card card-hover group overflow-hidden"
              >
                <div className="relative aspect-[16/10] img-ph">
                  <Image
                    src={lot.images[0] ?? "/cars/hero-wide.jpg"}
                    alt={lot.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  <span className="badge badge-sold absolute left-3 top-3">Sold</span>
                </div>
                <div className="flex items-center justify-between gap-4 p-4">
                  <h3 className="text-[16px] leading-snug transition-colors group-hover:text-brand-500">
                    {lot.title}
                  </h3>
                  <p className="num display shrink-0 text-[20px] font-bold">
                    {money(lot.current_bid)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ───────────── Consign CTA ───────────── */}
      <section className="border-t border-ink-100 bg-ink-900 text-white">
        <div className="wrap grid gap-8 py-16 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div>
            <p className="eyebrow">Sell With Us</p>
            <h2 className="mt-3 text-[34px] leading-tight sm:text-[40px]">
              Your car deserves the right room
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-300">
              We photograph, inspect and catalogue every consignment in-house, then put it in front
              of a vetted audience of collectors and brokers. Flat seller's commission, no listing
              fee, and no charge if the lot does not sell.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <Link href="/sell" className="btn btn-primary btn-lg w-full md:w-auto">
              Submit Your Vehicle
            </Link>
            <Link href="/how-it-works#fees" className="btn btn-ghost-light w-full md:w-auto">
              See Our Fees
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
