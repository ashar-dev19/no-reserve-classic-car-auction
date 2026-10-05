import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { CalendarDays, MapPin } from "lucide-react";
import { Countdown } from "@/components/countdown";
import { auctionLotStats, getAuctions } from "@/lib/queries";
import { compactMoney, dateOnly } from "@/lib/format";
import { sweep } from "@/lib/auction";

export const metadata: Metadata = {
  title: "Auction Calendar",
  description: "Live, upcoming and past No Reserve Classics sales.",
};

const GROUPS: Array<[string, string, string]> = [
  ["live", "Bidding now", "Lots are open and closing on the clock."],
  ["scheduled", "Upcoming", "Catalogues published; bidding opens on the date shown."],
  ["ended", "Results", "Full hammer prices for every lot, sold and unsold."],
];

export default function AuctionsPage() {
  sweep();
  const all = getAuctions();

  return (
    <>
      <header className="border-b border-ink-100 bg-ink-50">
        <div className="wrap py-10">
          <p className="eyebrow">Sales Calendar</p>
          <h1 className="mt-2 text-[36px] leading-tight sm:text-[44px]">Auctions</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-500">
            We run four to six sales a year — a mix of live East End events and timed online-only
            catalogues. Registration is free and carries across every sale.
          </p>
        </div>
      </header>

      <div className="wrap py-12">
        {GROUPS.map(([status, heading, blurb]) => {
          const group = all.filter((a) => a.status === status);
          if (group.length === 0) return null;

          return (
            <section key={status} className="mb-16 last:mb-0">
              <div className="border-b border-ink-100 pb-4">
                <h2 className="text-[26px]">{heading}</h2>
                <p className="mt-1 text-[14px] text-ink-400">{blurb}</p>
              </div>

              <div className="mt-6 space-y-5">
                {group.map((a) => {
                  const stats = auctionLotStats(a.id);
                  return (
                    <article key={a.id} className="card card-hover overflow-hidden">
                      <div className="grid md:grid-cols-[320px_1fr]">
                        <Link
                          href={`/auctions/${a.slug}`}
                          className="relative aspect-[16/10] md:aspect-auto img-ph"
                        >
                          <Image
                            src={a.hero_image ?? "/cars/hero-wide.jpg"}
                            alt={a.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 320px"
                            className="object-cover"
                          />
                          {a.status === "live" && (
                            <span className="badge badge-live absolute left-3 top-3">
                              <i className="pulse-dot" /> Live
                            </span>
                          )}
                        </Link>

                        <div className="flex flex-col justify-between gap-5 p-6">
                          <div>
                            <h3 className="text-[24px] leading-tight">
                              <Link
                                href={`/auctions/${a.slug}`}
                                className="transition-colors hover:text-brand-500"
                              >
                                {a.title}
                              </Link>
                            </h3>
                            <p className="mt-1.5 text-[14px] text-ink-400">{a.subtitle}</p>
                            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-ink-400">
                              <span className="flex items-center gap-1.5">
                                <CalendarDays size={14} />
                                {dateOnly(a.starts_at)} – {dateOnly(a.ends_at)}
                              </span>
                              {a.location && (
                                <span className="flex items-center gap-1.5">
                                  <MapPin size={14} /> {a.location}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-end justify-between gap-5 border-t border-ink-100 pt-4">
                            <dl className="flex flex-wrap gap-x-8 gap-y-3">
                              <div>
                                <dt className="text-[11px] uppercase tracking-[0.1em] text-ink-400">
                                  Lots
                                </dt>
                                <dd className="num display text-[20px] font-bold">{stats.total}</dd>
                              </div>
                              {a.status === "ended" ? (
                                <>
                                  <div>
                                    <dt className="text-[11px] uppercase tracking-[0.1em] text-ink-400">
                                      Sold
                                    </dt>
                                    <dd className="num display text-[20px] font-bold">
                                      {stats.sold}
                                    </dd>
                                  </div>
                                  <div>
                                    <dt className="text-[11px] uppercase tracking-[0.1em] text-ink-400">
                                      Hammer total
                                    </dt>
                                    <dd className="num display text-[20px] font-bold">
                                      {compactMoney(stats.hammer)}
                                    </dd>
                                  </div>
                                </>
                              ) : (
                                <div>
                                  <dt className="text-[11px] uppercase tracking-[0.1em] text-ink-400">
                                    {a.status === "live" ? "Sale closes in" : "Opens in"}
                                  </dt>
                                  <dd>
                                    <Countdown
                                      endsAt={a.status === "live" ? a.ends_at : a.starts_at}
                                      className="display text-[20px] font-bold"
                                    />
                                  </dd>
                                </div>
                              )}
                            </dl>

                            <Link href={`/auctions/${a.slug}`} className="btn btn-dark btn-sm">
                              {a.status === "ended" ? "View results" : "View catalogue"}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
