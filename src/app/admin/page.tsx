import Link from "next/link";
import type { Metadata } from "next";
import { Gavel, Receipt, TrendingUp, UserCheck, Users, Package } from "lucide-react";
import { StatTile } from "@/components/stat-tile";
import { LiveMonitor } from "@/components/live-monitor";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { listLots, sweep } from "@/lib/auction";
import { compactMoney, money, relativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "Admin Overview" };

export default async function AdminOverviewPage() {
  sweep();
  await requireAdmin();

  const stats = db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM lots WHERE status = 'live')                        AS live,
         (SELECT COUNT(*) FROM lots WHERE status != 'draft')                      AS totalLots,
         (SELECT COUNT(*) FROM lots WHERE status = 'sold')                        AS sold,
         (SELECT COALESCE(SUM(current_bid),0) FROM lots WHERE status='sold')      AS hammer,
         (SELECT COALESCE(SUM(premium),0) FROM invoices WHERE status != 'void')   AS premium,
         (SELECT COUNT(*) FROM users WHERE bidder_status = 'pending')             AS pending,
         (SELECT COUNT(*) FROM users WHERE bidder_status = 'approved')            AS approved,
         (SELECT COUNT(*) FROM bids)                                              AS bids,
         (SELECT COUNT(*) FROM consignments WHERE status = 'new')                 AS consignments,
         (SELECT COUNT(*) FROM rsvps)                                             AS rsvps,
         (SELECT COALESCE(SUM(total),0) FROM invoices WHERE status = 'due')       AS outstanding`,
    )
    .get() as Record<string, number>;

  const liveLots = listLots({ status: "live", sort: "ending", limit: 12 });

  const recentBids = db
    .prepare(
      `SELECT b.id, b.amount, b.created_at, b.is_auto, u.name AS bidder, l.title, l.slug, l.lot_no
         FROM bids b
         JOIN users u ON u.id = b.user_id
         JOIN lots  l ON l.id = b.lot_id
        ORDER BY b.created_at DESC, b.id DESC
        LIMIT 12`,
    )
    .all() as Array<{
    id: number;
    amount: number;
    created_at: number;
    is_auto: number;
    bidder: string;
    title: string;
    slug: string;
    lot_no: string;
  }>;

  return (
    <div className="space-y-10">
      {/* Needs attention */}
      {(stats.pending > 0 || stats.consignments > 0) && (
        <section className="grid gap-4 sm:grid-cols-2">
          {stats.pending > 0 && (
            <Link
              href="/admin/bidders"
              className="card card-hover flex items-center justify-between gap-4 border-l-[3px] border-l-amber-ac bg-[#fffaf2] p-5"
            >
              <div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-ink-400">
                  Awaiting approval
                </p>
                <p className="mt-1 text-[17px] font-medium">
                  {stats.pending} bidder registration{stats.pending === 1 ? "" : "s"}
                </p>
              </div>
              <UserCheck size={22} className="shrink-0 text-amber-ac" />
            </Link>
          )}
          {stats.consignments > 0 && (
            <Link
              href="/admin/consignments"
              className="card card-hover flex items-center justify-between gap-4 border-l-[3px] border-l-amber-ac bg-[#fffaf2] p-5"
            >
              <div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-ink-400">
                  New consignments
                </p>
                <p className="mt-1 text-[17px] font-medium">
                  {stats.consignments} submission{stats.consignments === 1 ? "" : "s"} to review
                </p>
              </div>
              <Package size={22} className="shrink-0 text-amber-ac" />
            </Link>
          )}
        </section>
      )}

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Lots live"
          value={String(stats.live)}
          sub={`${stats.totalLots} catalogued`}
          icon={Gavel}
          tone="brand"
        />
        <StatTile
          label="Hammer total"
          value={compactMoney(stats.hammer)}
          sub={`${stats.sold} lots sold`}
          icon={TrendingUp}
          tone="gain"
        />
        <StatTile
          label="Premium earned"
          value={compactMoney(stats.premium)}
          sub="Buyer's premium across all invoices"
          icon={Receipt}
        />
        <StatTile
          label="Approved bidders"
          value={String(stats.approved)}
          sub={`${stats.bids} bids placed · ${stats.rsvps} event RSVPs`}
          icon={Users}
        />
      </section>

      {stats.outstanding > 0 && (
        <Link
          href="/admin/invoices"
          className="card card-hover flex flex-wrap items-center justify-between gap-4 p-5"
        >
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-ink-400">
              Outstanding receivables
            </p>
            <p className="num display mt-1 text-[28px] font-bold leading-none">
              {money(stats.outstanding)}
            </p>
          </div>
          <span className="btn btn-outline btn-sm">Manage invoices</span>
        </Link>
      )}

      {/* Live monitor */}
      <section>
        <div className="mb-5 flex items-end justify-between gap-4 border-b border-ink-100 pb-4">
          <div>
            <h2 className="text-[24px]">Live monitor</h2>
            <p className="mt-1 text-[13px] text-ink-400">
              Updates as bids land. Close or extend any lot from here.
            </p>
          </div>
          <Link href="/admin/lots" className="text-[13px] text-brand-500 hover:underline">
            Manage all lots
          </Link>
        </div>

        <LiveMonitor
          lots={liveLots.map((l) => ({
            id: l.id,
            slug: l.slug,
            lot_no: l.lot_no,
            title: l.title,
            current_bid: l.current_bid,
            starting_bid: l.starting_bid,
            bid_count: l.bid_count,
            ends_at: l.ends_at,
            reserve: l.reserve,
            has_reserve: l.has_reserve,
            reserve_met: l.reserve_met,
            high_bidder_name: l.high_bidder_name,
          }))}
        />
      </section>

      {/* Bid feed */}
      <section>
        <h2 className="mb-5 border-b border-ink-100 pb-4 text-[24px]">Recent bids</h2>
        {recentBids.length === 0 ? (
          <p className="py-10 text-center text-[14px] text-ink-400">No bids recorded yet.</p>
        ) : (
          <div className="card overflow-hidden">
            <div className="rows">
              {recentBids.map((b) => (
                <Link
                  key={b.id}
                  href={`/lots/${b.slug}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-ink-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px]">
                      <span className="font-medium">{b.bidder}</span>
                      <span className="text-ink-400"> bid on </span>
                      Lot {b.lot_no} · {b.title}
                    </p>
                    <p className="text-[12px] text-ink-400">
                      {relativeTime(b.created_at)}
                      {b.is_auto === 1 && " · automatic"}
                    </p>
                  </div>
                  <p className="num display shrink-0 text-[17px] font-bold tabular-nums">
                    {money(b.amount)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
