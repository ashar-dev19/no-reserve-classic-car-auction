import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { listLots, sweep } from "@/lib/auction";
import { getAuctions } from "@/lib/queries";
import { dateTime, money } from "@/lib/format";
import { AdminLotActions } from "@/components/admin-lot-actions";

export const metadata: Metadata = { title: "Manage Lots" };

const STATUS_BADGE: Record<string, string> = {
  live: "badge-live",
  scheduled: "badge-soon",
  sold: "badge-sold",
  unsold: "badge-ended",
  draft: "badge-outline",
};

export default async function AdminLotsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  sweep();
  await requireAdmin();
  const sp = await searchParams;
  const auctionSlug = typeof sp.auction === "string" ? sp.auction : undefined;
  const status = typeof sp.status === "string" ? sp.status : "all";
  const saved = typeof sp.saved === "string" ? sp.saved : undefined;

  const auctions = getAuctions();
  const lots = listLots({ auctionSlug, status, sort: "ending", limit: 300 });

  return (
    <div>
      {saved && (
        <p className="slide-up mb-6 flex items-center gap-2 rounded-sm bg-gain-soft px-4 py-3 text-[14px] text-gain">
          <CheckCircle2 size={16} />
          Lot saved.{" "}
          <Link href={`/lots/${saved}`} className="underline">
            View it on the public site
          </Link>
        </p>
      )}

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-ink-100 pb-4">
        <div>
          <h2 className="text-[26px]">Lots</h2>
          <p className="mt-1 text-[13px] text-ink-400">
            {lots.length} lot{lots.length === 1 ? "" : "s"} in this view
          </p>
        </div>
        <Link href="/admin/lots/new" className="btn btn-primary btn-sm">
          <Plus size={15} /> New Lot
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/admin/lots"
          className={`display h-9 rounded-sm border px-3 text-[12px] font-bold uppercase leading-[34px] tracking-[0.07em] ${
            !auctionSlug && status === "all"
              ? "border-ink-900 bg-ink-900 text-white"
              : "border-ink-200 text-ink-500 hover:border-ink-900"
          }`}
        >
          All
        </Link>
        {auctions.map((a) => (
          <Link
            key={a.id}
            href={`/admin/lots?auction=${a.slug}`}
            className={`display h-9 rounded-sm border px-3 text-[12px] font-bold uppercase leading-[34px] tracking-[0.07em] ${
              auctionSlug === a.slug
                ? "border-ink-900 bg-ink-900 text-white"
                : "border-ink-200 text-ink-500 hover:border-ink-900"
            }`}
          >
            {a.title}
          </Link>
        ))}
      </div>

      {lots.length === 0 ? (
        <p className="py-16 text-center text-[15px] text-ink-400">No lots in this view.</p>
      ) : (
        <div className="card overflow-hidden">
          <div className="rows">
            {lots.map((lot) => (
              <div key={lot.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-sm img-ph">
                  <Image
                    src={lot.images[0] ?? "/cars/hero-wide.jpg"}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>

                <div className="min-w-[200px] flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] uppercase tracking-[0.1em] text-ink-400">
                      Lot {lot.lot_no}
                    </span>
                    <span className={`badge ${STATUS_BADGE[lot.status] ?? "badge-outline"}`}>
                      {lot.status}
                    </span>
                    {!lot.has_reserve && <span className="badge badge-noreserve">No Reserve</span>}
                    {lot.featured === 1 && <span className="badge badge-outline">Featured</span>}
                  </div>
                  <h3 className="mt-0.5 truncate text-[16px] leading-snug">
                    <Link href={`/lots/${lot.slug}`} className="hover:text-brand-500">
                      {lot.title}
                    </Link>
                  </h3>
                  <p className="text-[12px] text-ink-400">{lot.auction_title}</p>
                </div>

                <dl className="flex flex-wrap justify-end gap-x-6 gap-y-2 text-right">
                  <div className="min-w-[90px]">
                    <dt className="text-[10px] uppercase tracking-[0.1em] text-ink-400">
                      {lot.status === "sold" ? "Hammer" : "Current"}
                    </dt>
                    <dd className="num display text-[17px] font-bold tabular-nums">
                      {money(lot.bid_count === 0 ? lot.starting_bid : lot.current_bid)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-[0.1em] text-ink-400">Bids</dt>
                    <dd className="num text-[16px] tabular-nums">{lot.bid_count}</dd>
                  </div>
                  <div className="min-w-[110px]">
                    <dt className="text-[10px] uppercase tracking-[0.1em] text-ink-400">Closes</dt>
                    <dd className="text-[13px] text-ink-500">{dateTime(lot.ends_at)}</dd>
                  </div>
                  <div className="min-w-[90px]">
                    <dt className="text-[10px] uppercase tracking-[0.1em] text-ink-400">Reserve</dt>
                    <dd className="text-[13px]">
                      {lot.has_reserve === 0 ? (
                        <span className="text-ink-400">None</span>
                      ) : lot.reserve_met ? (
                        <span className="text-gain">Met</span>
                      ) : (
                        <span className="num text-ink-500">{money(lot.reserve)}</span>
                      )}
                    </dd>
                  </div>
                </dl>

                <AdminLotActions
                  lotId={lot.id}
                  slug={lot.slug}
                  status={lot.status}
                  bidCount={lot.bid_count}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
