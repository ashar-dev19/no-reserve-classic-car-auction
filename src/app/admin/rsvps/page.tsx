import type { Metadata } from "next";
import { Users } from "lucide-react";
import { StatTile } from "@/components/stat-tile";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { dateOnly } from "@/lib/format";

export const metadata: Metadata = { title: "Event RSVPs" };

interface Rsvp {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  brokerage: string | null;
  guests: number;
  intent: string | null;
  created_at: number;
  auction_title: string | null;
}

const INTENT_BADGE: Record<string, string> = {
  bidding: "badge-live",
  attending: "badge-soon",
  consigning: "badge-noreserve",
};

export default async function RsvpsPage() {
  await requireAdmin();

  const rows = db
    .prepare(
      `SELECT r.*, a.title AS auction_title
         FROM rsvps r LEFT JOIN auctions a ON a.id = r.auction_id
        ORDER BY r.created_at DESC`,
    )
    .all() as Rsvp[];

  const totals = rows.reduce(
    (acc, r) => {
      acc.heads += 1 + r.guests;
      if (r.intent === "bidding") acc.bidding++;
      if (r.intent === "consigning") acc.consigning++;
      return acc;
    },
    { heads: 0, bidding: 0, consigning: 0 },
  );

  return (
    <div>
      <div className="mb-6 border-b border-ink-100 pb-4">
        <h2 className="text-[26px]">Event RSVPs</h2>
        <p className="mt-1 text-[13px] text-ink-400">
          Registrations from the Hamptons Collector Sale invitation page.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="RSVPs" value={String(rows.length)} icon={Users} tone="brand" />
        <StatTile label="Expected heads" value={String(totals.heads)} sub="Including guests" />
        <StatTile label="Plan to bid" value={String(totals.bidding)} tone="gain" />
        <StatTile label="Want to consign" value={String(totals.consigning)} tone="warn" />
      </div>

      {rows.length === 0 ? (
        <p className="py-16 text-center text-[15px] text-ink-400">No RSVPs yet.</p>
      ) : (
        <div className="card overflow-hidden">
          <div className="thin-scroll overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-ink-100 text-[10px] uppercase tracking-[0.12em] text-ink-400">
                  <th className="px-4 py-3 font-bold">Guest</th>
                  <th className="px-4 py-3 font-bold">Brokerage</th>
                  <th className="px-4 py-3 font-bold">Intent</th>
                  <th className="px-4 py-3 font-bold">Party</th>
                  <th className="px-4 py-3 font-bold">Registered</th>
                </tr>
              </thead>
              <tbody className="rows">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3">
                      <p className="text-[14px] font-medium">{r.name}</p>
                      <p className="text-[12px] text-ink-400">
                        {r.email}
                        {r.phone && ` · ${r.phone}`}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-[14px] text-ink-500">{r.brokerage ?? "—"}</td>
                    <td className="px-4 py-3">
                      {r.intent ? (
                        <span className={`badge ${INTENT_BADGE[r.intent] ?? "badge-outline"}`}>
                          {r.intent}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="num px-4 py-3 text-[14px] tabular-nums text-ink-500">
                      {1 + r.guests}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-ink-400">
                      {dateOnly(r.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
