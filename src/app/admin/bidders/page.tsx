import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { BidderRow } from "@/components/admin-bidder-row";

export const metadata: Metadata = { title: "Bidders" };

interface Row {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  role: string;
  bidder_status: string;
  bid_limit: number;
  paddle_no: string | null;
  created_at: number;
  bid_count: number;
  lots_won: number;
  total_spend: number;
}

export default async function BiddersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const filter = typeof sp.status === "string" ? sp.status : "all";

  const rows = db
    .prepare(
      `SELECT u.*,
              (SELECT COUNT(*) FROM bids WHERE user_id = u.id)                      AS bid_count,
              (SELECT COUNT(*) FROM lots WHERE winner_id = u.id)                    AS lots_won,
              (SELECT COALESCE(SUM(total),0) FROM invoices WHERE user_id = u.id)    AS total_spend
         FROM users u
        ${filter === "all" ? "" : "WHERE u.bidder_status = ?"}
        ORDER BY CASE u.bidder_status WHEN 'pending' THEN 0 ELSE 1 END, u.created_at DESC`,
    )
    .all(...(filter === "all" ? [] : [filter])) as Row[];

  const counts = db
    .prepare(
      `SELECT
         COUNT(*)                                                   AS all_count,
         SUM(CASE WHEN bidder_status='pending'   THEN 1 ELSE 0 END) AS pending,
         SUM(CASE WHEN bidder_status='approved'  THEN 1 ELSE 0 END) AS approved,
         SUM(CASE WHEN bidder_status='suspended' THEN 1 ELSE 0 END) AS suspended
       FROM users`,
    )
    .get() as Record<string, number>;

  const TABS: Array<[string, string, number]> = [
    ["all", "All", counts.all_count ?? 0],
    ["pending", "Pending", counts.pending ?? 0],
    ["approved", "Approved", counts.approved ?? 0],
    ["suspended", "Suspended", counts.suspended ?? 0],
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-ink-100 pb-4">
        <div>
          <h2 className="text-[26px]">Bidder registrations</h2>
          <p className="mt-1 text-[13px] text-ink-400">
            Approving a registration issues a paddle and notifies the bidder immediately.
          </p>
        </div>
        <div className="flex gap-2">
          {TABS.map(([value, label, count]) => (
            <a
              key={value}
              href={value === "all" ? "/admin/bidders" : `/admin/bidders?status=${value}`}
              className={`display h-9 rounded-sm border px-3 text-[12px] font-bold uppercase leading-[34px] tracking-[0.07em] transition-colors ${
                filter === value
                  ? "border-ink-900 bg-ink-900 text-white"
                  : "border-ink-200 text-ink-500 hover:border-ink-900"
              }`}
            >
              {label} ({count})
            </a>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="py-16 text-center text-[15px] text-ink-400">No bidders in this view.</p>
      ) : (
        <div className="card overflow-hidden">
          <div className="rows">
            {rows.map((r) => (
              <BidderRow key={r.id} bidder={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
