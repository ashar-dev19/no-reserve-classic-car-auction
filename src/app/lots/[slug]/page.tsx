import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Check, ChevronRight, MapPin, TriangleAlert } from "lucide-react";
import { BidPanel } from "@/components/bid-panel";
import { BidHistory } from "@/components/bid-history";
import { CommentThread } from "@/components/comment-thread";
import { Gallery } from "@/components/gallery";
import { WatchButton } from "@/components/watch-button";
import { LotCard } from "@/components/lot-card";
import { toCardData } from "@/lib/lot-card-data";
import { getBids, getLotBySlug, listLots, sweep } from "@/lib/auction";
import { getAuctionBySlug, getComments, isWatching } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { numberFmt } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lot = getLotBySlug(slug);
  if (!lot) return { title: "Lot not found" };
  return {
    title: lot.title,
    description: lot.summary ?? undefined,
    openGraph: { images: lot.images[0] ? [lot.images[0]] : [] },
  };
}

const SPEC_FIELDS: Array<[label: string, key: string]> = [
  ["Year", "year"],
  ["Make", "make"],
  ["Model", "model"],
  ["VIN", "vin"],
  ["Mileage", "mileage"],
  ["Engine", "engine"],
  ["Transmission", "transmission"],
  ["Drivetrain", "drivetrain"],
  ["Exterior", "exterior"],
  ["Interior", "interior"],
  ["Location", "location"],
  ["Category", "category"],
];

export default async function LotPage({ params }: { params: Promise<{ slug: string }> }) {
  sweep();
  const { slug } = await params;
  const lot = getLotBySlug(slug);
  if (!lot) notFound();

  const user = await getCurrentUser();
  const auction = lot.auction_slug ? getAuctionBySlug(lot.auction_slug) : null;
  const bids = getBids(lot.id, 100);
  const comments = getComments(lot.id);
  const watching = user ? isWatching(user.id, lot.id) : false;

  db.prepare(`UPDATE lots SET view_count = view_count + 1 WHERE id = ?`).run(lot.id);

  const related = listLots({
    auctionSlug: lot.auction_slug,
    status: "open",
    sort: "ending",
    limit: 4,
  }).filter((l) => l.id !== lot.id);

  return (
    <>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="border-b border-ink-100 bg-ink-50">
        <ol className="wrap flex flex-wrap items-center gap-1.5 py-3 text-[12px] text-ink-400">
          <li>
            <Link href="/" className="hover:text-ink-900">
              Home
            </Link>
          </li>
          <ChevronRight size={13} />
          <li>
            <Link href="/auctions" className="hover:text-ink-900">
              Auctions
            </Link>
          </li>
          {auction && (
            <>
              <ChevronRight size={13} />
              <li>
                <Link href={`/auctions/${auction.slug}`} className="hover:text-ink-900">
                  {auction.title}
                </Link>
              </li>
            </>
          )}
          <ChevronRight size={13} />
          <li aria-current="page" className="text-ink-900">
            Lot {lot.lot_no}
          </li>
        </ol>
      </nav>

      <div className="wrap py-8">
        {/* Title block */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <div className="mb-2.5 flex flex-wrap items-center gap-2">
              <span className="badge badge-outline">Lot {lot.lot_no}</span>
              {lot.status === "live" && (
                <span className="badge badge-live">
                  <i className="pulse-dot" /> Bidding open
                </span>
              )}
              {lot.status === "scheduled" && <span className="badge badge-soon">Opens soon</span>}
              {lot.status === "sold" && <span className="badge badge-sold">Sold</span>}
              {lot.status === "unsold" && <span className="badge badge-ended">Not sold</span>}
              {!lot.has_reserve && <span className="badge badge-noreserve">No Reserve</span>}
            </div>
            <h1 className="text-[34px] leading-tight sm:text-[42px]">{lot.title}</h1>
            {lot.summary && (
              <p className="mt-3 text-[16px] leading-relaxed text-ink-500">{lot.summary}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-ink-400">
              {lot.mileage != null && <span>{numberFmt(lot.mileage)} miles</span>}
              {lot.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} /> {lot.location}
                </span>
              )}
              <span>{numberFmt(lot.view_count)} views</span>
            </div>
          </div>
          <WatchButton lotId={lot.id} initialWatching={watching} />
        </div>

        {/* Main grid */}
        {/* Three grid children rather than two, so the bid box can sit directly
            under the gallery on a phone instead of below the whole write-up,
            while still holding the right-hand column on a wide screen. */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 lg:col-start-1 lg:row-start-1">
            <Gallery images={lot.images} title={lot.title} />
          </div>

          {/* Bid panel */}
          <aside className="min-w-0 lg:col-start-2 lg:row-start-1 lg:row-span-2">
            <BidPanel
              lotId={lot.id}
              lotNo={lot.lot_no}
              initialCurrentBid={lot.current_bid}
              initialBidCount={lot.bid_count}
              initialEndsAt={lot.ends_at}
              startingBid={lot.starting_bid}
              hasReserve={lot.has_reserve === 1}
              initialReserveMet={lot.reserve_met}
              initialStatus={lot.status}
              initialHighBidderId={lot.high_bidder_id}
              initialHighBidderName={lot.high_bidder_name}
              estimateLow={lot.estimate_low}
              estimateHigh={lot.estimate_high}
              buyersPremiumBps={auction?.buyers_premium_bps ?? 1000}
              user={user}
            />

            {auction && (
              <div className="card mt-5 p-5">
                <p className="eyebrow-dim eyebrow">Part of</p>
                <h3 className="mt-2 text-[17px] leading-snug">
                  <Link href={`/auctions/${auction.slug}`} className="hover:text-brand-500">
                    {auction.title}
                  </Link>
                </h3>
                <p className="mt-1 text-[13px] text-ink-400">{auction.subtitle}</p>
                <Link
                  href={`/auctions/${auction.slug}`}
                  className="btn btn-outline btn-sm mt-4 w-full"
                >
                  View all lots in this sale
                </Link>
              </div>
            )}
          </aside>

          <div className="min-w-0 lg:col-start-1 lg:row-start-2">

            {/* Specification */}
            <section className="mt-10">
              <h2 className="text-[22px]">Specification</h2>
              <dl className="mt-4 grid gap-x-8 gap-y-0 sm:grid-cols-2">
                {SPEC_FIELDS.map(([label, key]) => {
                  const raw = (lot as unknown as Record<string, unknown>)[key];
                  if (raw == null || raw === "") return null;
                  const value = key === "mileage" ? `${numberFmt(Number(raw))} mi` : String(raw);
                  return (
                    <div
                      key={key}
                      className="flex justify-between gap-4 border-b border-ink-100 py-2.5"
                    >
                      <dt className="text-[13px] uppercase tracking-[0.06em] text-ink-400">
                        {label}
                      </dt>
                      <dd className="text-right text-[14px] font-medium">{value}</dd>
                    </div>
                  );
                })}
              </dl>
            </section>

            {/* Highlights & known flaws, side by side — the second one is the point */}
            <section className="mt-10 grid gap-8 sm:grid-cols-2">
              {lot.highlights.length > 0 && (
                <div>
                  <h2 className="text-[22px]">Highlights</h2>
                  <ul className="mt-4 space-y-2.5">
                    {lot.highlights.map((h) => (
                      <li key={h} className="flex gap-2.5 text-[14px] leading-relaxed">
                        <Check size={16} className="mt-0.5 shrink-0 text-gain" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h2 className="text-[22px]">Known flaws</h2>
                {lot.flaws.length > 0 ? (
                  <ul className="mt-4 space-y-2.5">
                    {lot.flaws.map((f) => (
                      <li key={f} className="flex gap-2.5 text-[14px] leading-relaxed">
                        <TriangleAlert size={16} className="mt-0.5 shrink-0 text-amber-ac" />
                        {f}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-[14px] leading-relaxed text-ink-400">
                    Our inspector recorded no notable faults on this lot.
                  </p>
                )}
                <p className="mt-4 text-[12px] leading-relaxed text-ink-400">
                  We publish every flaw our inspector finds. Lots are sold as-is; viewing is
                  encouraged and can be arranged on request.
                </p>
              </div>
            </section>

            {/* Description */}
            {lot.description && (
              <section className="mt-10">
                <h2 className="text-[22px]">Description</h2>
                <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-ink-600">
                  {lot.description.split("\n\n").map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </section>
            )}

            {/* Bid history */}
            <section className="mt-10">
              <div className="mb-4 flex items-end justify-between gap-4">
                <h2 className="text-[22px]">Bid history</h2>
                <span className="text-[13px] text-ink-400">{lot.bid_count} bids</span>
              </div>
              <BidHistory
                lotId={lot.id}
                currentUserId={user?.id ?? null}
                initial={bids.map((b) => ({
                  id: b.id,
                  amount: b.amount,
                  is_auto: b.is_auto,
                  created_at: b.created_at,
                  bidder_name: b.bidder_name,
                  paddle_no: b.paddle_no,
                  user_id: b.user_id,
                }))}
              />
            </section>

            {/* Comments */}
            <section className="mt-10">
              <h2 className="mb-4 text-[22px]">Questions &amp; comments</h2>
              <CommentThread lotId={lot.id} comments={comments} user={user} />
            </section>
          </div>

        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-16 border-t border-ink-100 pt-10">
            <h2 className="text-[24px]">Also in this sale</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((r) => (
                <LotCard key={r.id} lot={toCardData(r)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
