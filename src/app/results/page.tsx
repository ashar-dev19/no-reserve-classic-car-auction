import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { listLots, sweep } from "@/lib/auction";
import { platformStats } from "@/lib/queries";
import { compactMoney, dateOnly, money } from "@/lib/format";

export const metadata: Metadata = {
  title: "Results",
  description: "Hammer prices for every settled lot, sold and unsold alike.",
};

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  sweep();
  const sp = await searchParams;
  const show = typeof sp.show === "string" ? sp.show : "sold";
  const stats = platformStats();

  const lots = listLots({
    status: show === "all" ? "closed" : show,
    sort: "price_desc",
    limit: 200,
  });

  return (
    <>
      <header className="border-b border-ink-100 bg-ink-50">
        <div className="wrap py-10">
          <p className="eyebrow">Transparency</p>
          <h1 className="mt-2 text-[36px] leading-tight sm:text-[44px]">Results</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-500">
            We publish the hammer price for every lot that goes under the gavel, whether it sold or
            not. No hidden results, no quietly removed listings.
          </p>

          <dl className="mt-8 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-5 border-t border-ink-150 pt-6 sm:grid-cols-3">
            {[
              ["Lots sold", String(stats.lotsSold)],
              ["Hammer total", compactMoney(stats.hammerTotal)],
              ["Sell-through", `${stats.sellThroughPct}%`],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[11px] uppercase tracking-[0.1em] text-ink-400">{label}</dt>
                <dd className="num display mt-1 text-[28px] font-bold leading-none">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <div className="wrap py-10">
        <div className="mb-6 flex gap-2">
          {[
            ["sold", "Sold"],
            ["unsold", "Not sold"],
            ["all", "Everything"],
          ].map(([value, label]) => (
            <Link
              key={value}
              href={value === "sold" ? "/results" : `/results?show=${value}`}
              className={`display h-9 rounded-sm border px-3.5 text-[12px] font-bold uppercase leading-[34px] tracking-[0.07em] transition-colors ${
                show === value
                  ? "border-ink-900 bg-ink-900 text-white"
                  : "border-ink-200 text-ink-500 hover:border-ink-900"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {lots.length === 0 ? (
          <p className="py-20 text-center text-[15px] text-ink-400">
            No settled lots in this view yet.
          </p>
        ) : (
          <div className="card overflow-hidden">
            <div className="rows">
              {lots.map((lot) => (
                <Link
                  key={lot.id}
                  href={`/lots/${lot.slug}`}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-ink-50 sm:gap-5"
                >
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-sm img-ph sm:h-20 sm:w-32">
                    <Image
                      src={lot.images[0] ?? "/cars/hero-wide.jpg"}
                      alt=""
                      fill
                      sizes="128px"
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-[0.1em] text-ink-400">
                      Lot {lot.lot_no} · {lot.auction_title}
                    </p>
                    <h2 className="mt-0.5 truncate text-[17px] leading-snug">{lot.title}</h2>
                    <p className="mt-1 hidden truncate text-[13px] text-ink-400 sm:block">
                      {lot.bid_count} bids · closed {dateOnly(lot.ends_at)}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="num display text-[20px] font-bold leading-tight tabular-nums sm:text-[24px]">
                      {money(lot.current_bid)}
                    </p>
                    <span
                      className={`badge mt-1 ${lot.status === "sold" ? "badge-sold" : "badge-ended"}`}
                    >
                      {lot.status === "sold" ? "Sold" : "Not sold"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
