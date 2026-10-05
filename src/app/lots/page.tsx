import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { LotCard } from "@/components/lot-card";
import { toCardData } from "@/lib/lot-card-data";
import { LotFilters } from "@/components/lot-filters";
import { listLots, sweep, type LotQuery } from "@/lib/auction";
import { distinctValues } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Browse Lots",
  description: "Every lot currently catalogued across No Reserve Classics sales.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const PAGE_SIZE = 24;

export default async function LotsPage({ searchParams }: { searchParams: SearchParams }) {
  sweep();
  const sp = await searchParams;
  const one = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const page = Math.max(1, Number(one("page") ?? 1) || 1);
  const query: LotQuery = {
    status: one("status") ?? "open",
    make: one("make"),
    category: one("category"),
    search: one("q"),
    noReserve: one("noReserve") === "1",
    sort: (one("sort") as LotQuery["sort"]) ?? "ending",
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };

  const lots = listLots(query);
  const nextPage = listLots({ ...query, offset: page * PAGE_SIZE, limit: 1 }).length > 0;

  const makes = distinctValues("make");
  const categories = distinctValues("category");

  const qs = (overrides: Record<string, string>) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      if (typeof v === "string" && v) next.set(k, v);
    }
    for (const [k, v] of Object.entries(overrides)) next.set(k, v);
    return `?${next.toString()}`;
  };

  return (
    <>
      <header className="border-b border-ink-100 bg-ink-50">
        <div className="wrap py-10">
          <p className="eyebrow">The Catalogue</p>
          <h1 className="mt-2 text-[36px] leading-tight sm:text-[44px]">Browse lots</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-500">
            Every lot across our current and past sales, with published condition reports and live
            bidding where the clock is still running.
          </p>
        </div>
      </header>

      <div className="wrap">
        <Suspense fallback={<div className="h-[76px]" />}>
          <LotFilters makes={makes} categories={categories} />
        </Suspense>

        <div className="py-8">
          <p className="mb-6 text-[13px] text-ink-400">
            {lots.length === 0
              ? "No lots match these filters"
              : `Showing ${lots.length} lot${lots.length === 1 ? "" : "s"}${page > 1 ? ` · page ${page}` : ""}`}
          </p>

          {lots.length === 0 ? (
            <div className="card flex flex-col items-center py-20 text-center">
              <SearchX size={28} className="text-ink-200" />
              <h2 className="mt-4 text-[20px]">Nothing here yet</h2>
              <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-ink-400">
                Try widening the status filter, or clearing the make and category to see the full
                catalogue.
              </p>
              <a href="/lots?status=all" className="btn btn-outline mt-6">
                Show every lot
              </a>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {lots.map((lot, i) => (
                <LotCard key={lot.id} lot={toCardData(lot)} priority={i < 4} />
              ))}
            </div>
          )}

          {(page > 1 || nextPage) && (
            <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Pagination">
              {page > 1 && (
                <a href={qs({ page: String(page - 1) })} className="btn btn-outline">
                  Previous
                </a>
              )}
              <span className="num text-[13px] text-ink-400">Page {page}</span>
              {nextPage && (
                <a href={qs({ page: String(page + 1) })} className="btn btn-outline">
                  Next
                </a>
              )}
            </nav>
          )}
        </div>
      </div>
    </>
  );
}
