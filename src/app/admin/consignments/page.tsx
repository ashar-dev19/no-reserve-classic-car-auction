import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { ConsignmentRow } from "@/components/admin-consignment-row";

export const metadata: Metadata = { title: "Consignments" };

export interface ConsignmentRecord {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  mileage: number | null;
  reserve_pref: string | null;
  notes: string | null;
  status: string;
  created_at: number;
}

export default async function ConsignmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const filter = typeof sp.status === "string" ? sp.status : "all";

  const rows = db
    .prepare(
      `SELECT * FROM consignments
        ${filter === "all" ? "" : "WHERE status = ?"}
        ORDER BY CASE status WHEN 'new' THEN 0 WHEN 'reviewing' THEN 1 ELSE 2 END, created_at DESC`,
    )
    .all(...(filter === "all" ? [] : [filter])) as ConsignmentRecord[];

  const counts = db
    .prepare(
      `SELECT COUNT(*) AS all_count,
              SUM(CASE WHEN status='new'       THEN 1 ELSE 0 END) AS new_count,
              SUM(CASE WHEN status='reviewing' THEN 1 ELSE 0 END) AS reviewing,
              SUM(CASE WHEN status='accepted'  THEN 1 ELSE 0 END) AS accepted,
              SUM(CASE WHEN status='declined'  THEN 1 ELSE 0 END) AS declined
         FROM consignments`,
    )
    .get() as Record<string, number>;

  const TABS: Array<[string, string, number]> = [
    ["all", "All", counts.all_count ?? 0],
    ["new", "New", counts.new_count ?? 0],
    ["reviewing", "Reviewing", counts.reviewing ?? 0],
    ["accepted", "Accepted", counts.accepted ?? 0],
    ["declined", "Declined", counts.declined ?? 0],
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-ink-100 pb-4">
        <div>
          <h2 className="text-[26px]">Consignment submissions</h2>
          <p className="mt-1 text-[13px] text-ink-400">
            Vehicles submitted through the public Sell form.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {TABS.map(([value, label, count]) => (
            <a
              key={value}
              href={value === "all" ? "/admin/consignments" : `/admin/consignments?status=${value}`}
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
        <p className="py-16 text-center text-[15px] text-ink-400">
          No consignment submissions in this view.
        </p>
      ) : (
        <div className="card overflow-hidden">
          <div className="rows">
            {rows.map((r) => (
              <ConsignmentRow key={r.id} record={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
