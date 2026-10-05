import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CalendarDays, MapPin, Receipt } from "lucide-react";
import { LotCard } from "@/components/lot-card";
import { toCardData } from "@/lib/lot-card-data";
import { Countdown } from "@/components/countdown";
import { auctionLotStats, getAuctionBySlug } from "@/lib/queries";
import { listLots, sweep } from "@/lib/auction";
import { compactMoney, dateOnly } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const auction = getAuctionBySlug(slug);
  if (!auction) return { title: "Auction not found" };
  return { title: auction.title, description: auction.subtitle ?? undefined };
}

export default async function AuctionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  sweep();
  const { slug } = await params;
  const sp = await searchParams;
  const auction = getAuctionBySlug(slug);
  if (!auction) notFound();

  const filter = typeof sp.show === "string" ? sp.show : "all";
  const lots = listLots({
    auctionSlug: slug,
    status: filter === "all" ? "all" : filter,
    sort: "ending",
    limit: 200,
  });
  const stats = auctionLotStats(auction.id);
  const ended = auction.status === "ended";

  const TABS: Array<[string, string, number]> = [
    ["all", "All lots", stats.total],
    ["open", "Open", stats.open],
    ["sold", "Sold", stats.sold],
  ];

  return (
    <>
      {/* Hero */}
      <header className="relative isolate overflow-hidden bg-ink-900 text-white">
        <Image
          src={auction.hero_image ?? "/cars/hero-wide.jpg"}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/95 to-ink-950/50" />

        <div className="wrap relative py-16">
          <nav aria-label="Breadcrumb" className="mb-5 text-[12px] text-ink-300">
            <Link href="/auctions" className="hover:text-white">
              Auctions
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white">{auction.title}</span>
          </nav>

          <div className="mb-3 flex flex-wrap gap-2">
            {auction.status === "live" && (
              <span className="badge badge-live">
                <i className="pulse-dot" /> Bidding open
              </span>
            )}
            {auction.status === "scheduled" && <span className="badge badge-soon">Upcoming</span>}
            {ended && <span className="badge badge-ended">Results</span>}
          </div>

          <h1 className="max-w-3xl text-[38px] leading-tight sm:text-[50px]">{auction.title}</h1>
          <p className="mt-2 text-[16px] text-ink-200">{auction.subtitle}</p>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-ink-300">
            <span className="flex items-center gap-2">
              <CalendarDays size={15} />
              {dateOnly(auction.starts_at)} – {dateOnly(auction.ends_at)}
            </span>
            {auction.venue && (
              <span className="flex items-center gap-2">
                <MapPin size={15} />
                {auction.venue}
                {auction.location ? `, ${auction.location}` : ""}
              </span>
            )}
            <span className="flex items-center gap-2">
              <Receipt size={15} />
              {auction.buyers_premium_bps / 100}% buyer's premium
            </span>
          </div>

          <dl className="mt-10 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-6 border-t border-white/15 pt-7 sm:grid-cols-4">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.12em] text-ink-300">Lots</dt>
              <dd className="num display mt-1 text-[26px] font-bold leading-none">{stats.total}</dd>
            </div>
            {ended ? (
              <>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.12em] text-ink-300">Sold</dt>
                  <dd className="num display mt-1 text-[26px] font-bold leading-none">
                    {stats.sold}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.12em] text-ink-300">
                    Hammer total
                  </dt>
                  <dd className="num display mt-1 text-[26px] font-bold leading-none">
                    {compactMoney(stats.hammer)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.12em] text-ink-300">
                    Sell-through
                  </dt>
                  <dd className="num display mt-1 text-[26px] font-bold leading-none">
                    {stats.total ? Math.round((stats.sold / stats.total) * 100) : 0}%
                  </dd>
                </div>
              </>
            ) : (
              <>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.12em] text-ink-300">Open now</dt>
                  <dd className="num display mt-1 text-[26px] font-bold leading-none">
                    {stats.open}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[11px] uppercase tracking-[0.12em] text-ink-300">
                    {auction.status === "live" ? "Sale closes in" : "Bidding opens in"}
                  </dt>
                  <dd>
                    <Countdown
                      endsAt={auction.status === "live" ? auction.ends_at : auction.starts_at}
                      className="display mt-1 text-[26px] font-bold leading-none !text-white"
                    />
                  </dd>
                </div>
              </>
            )}
          </dl>
        </div>
      </header>

      {/* Description */}
      {auction.description && (
        <section className="border-b border-ink-100 bg-ink-50">
          <div className="wrap max-w-3xl space-y-4 py-10 text-[15px] leading-relaxed text-ink-600">
            {auction.description.split("\n\n").map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
      )}

      {/* Lots */}
      <div className="wrap py-10">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-ink-100 pb-4">
          <h2 className="text-[28px]">Catalogue</h2>
          <div className="flex gap-2">
            {TABS.filter(([, , count]) => count > 0).map(([value, label, count]) => (
              <Link
                key={value}
                href={value === "all" ? `/auctions/${slug}` : `/auctions/${slug}?show=${value}`}
                scroll={false}
                className={`display h-9 rounded-sm border px-3.5 text-[12px] font-bold uppercase leading-[34px] tracking-[0.07em] transition-colors ${
                  filter === value
                    ? "border-ink-900 bg-ink-900 text-white"
                    : "border-ink-200 text-ink-500 hover:border-ink-900"
                }`}
              >
                {label} ({count})
              </Link>
            ))}
          </div>
        </div>

        {lots.length === 0 ? (
          <p className="py-16 text-center text-[15px] text-ink-400">
            No lots in this view yet.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {lots.map((lot, i) => (
              <LotCard key={lot.id} lot={toCardData(lot)} priority={i < 4} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
