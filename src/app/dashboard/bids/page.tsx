import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Gavel } from "lucide-react";
import { Countdown } from "@/components/countdown";
import { EmptyState } from "@/components/stat-tile";
import { requireUser } from "@/lib/auth";
import { getUserBidSummary } from "@/lib/queries";
import { sweep } from "@/lib/auction";
import { dateTime, money } from "@/lib/format";

export const metadata: Metadata = { title: "My Bids" };

const STANDING = {
  leading: ["Leading", "badge-sold"],
  outbid: ["Outbid", "badge-live"],
  won: ["Won", "badge-sold"],
  lost: ["Lost", "badge-ended"],
} as const;

export default async function BidsPage() {
  sweep();
  const user = await requireUser();
  const bids = getUserBidSummary(user.id);

  if (bids.length === 0) {
    return (
      <EmptyState
        icon={Gavel}
        title="You haven't bid yet"
        body="Every lot you bid on appears here with your maximum, your standing and the result."
        action={{ href: "/lots?status=live", label: "Browse live lots" }}
      />
    );
  }

  const open = bids.filter((b) => b.status === "live" || b.status === "scheduled");
  const closed = bids.filter((b) => b.status === "sold" || b.status === "unsold");

  return (
    <div className="space-y-12">
      {([["Open lots", open], ["Settled", closed]] as const).map(([heading, group]) =>
        group.length === 0 ? null : (
          <section key={heading}>
            <h2 className="mb-5 border-b border-ink-100 pb-4 text-[24px]">
              {heading} <span className="text-ink-300">({group.length})</span>
            </h2>

            <div className="card overflow-hidden">
              <div className="rows">
                {group.map((b) => {
                  const [label, cls] = STANDING[b.standing];
                  return (
                    <Link
                      key={b.id}
                      href={`/lots/${b.slug}`}
                      className="flex flex-wrap items-center gap-4 p-4 transition-colors hover:bg-ink-50"
                    >
                      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-sm img-ph">
                        <Image src={b.image} alt="" fill sizes="96px" className="object-cover" />
                      </div>

                      <div className="min-w-[180px] flex-1">
                        <p className="text-[11px] uppercase tracking-[0.1em] text-ink-400">
                          Lot {b.lot_no}
                        </p>
                        <h3 className="truncate text-[16px] leading-snug">{b.title}</h3>
                        <p className="mt-0.5 text-[12px] text-ink-400">
                          Last bid {dateTime(b.last_bid_at)}
                        </p>
                      </div>

                      <dl className="flex flex-wrap justify-end gap-x-6 gap-y-2 text-right">
                        <div>
                          <dt className="text-[10px] uppercase tracking-[0.1em] text-ink-400">
                            Your max
                          </dt>
                          <dd className="num text-[15px] font-medium tabular-nums">
                            {money(b.my_max)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[10px] uppercase tracking-[0.1em] text-ink-400">
                            {b.status === "sold" ? "Hammer" : "Current"}
                          </dt>
                          <dd className="num display text-[18px] font-bold tabular-nums">
                            {money(b.current_bid)}
                          </dd>
                        </div>
                        <div className="min-w-[90px]">
                          <dt className="text-[10px] uppercase tracking-[0.1em] text-ink-400">
                            {b.status === "live" || b.status === "scheduled" ? "Closes" : "Status"}
                          </dt>
                          <dd>
                            {b.status === "live" || b.status === "scheduled" ? (
                              <Countdown endsAt={b.ends_at} className="text-[14px] font-medium" />
                            ) : (
                              <span className="text-[14px] text-ink-400">
                                {b.status === "sold" ? "Sold" : "Not sold"}
                              </span>
                            )}
                          </dd>
                        </div>
                      </dl>

                      <span className={`badge ${cls} shrink-0`}>{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        ),
      )}
    </div>
  );
}
