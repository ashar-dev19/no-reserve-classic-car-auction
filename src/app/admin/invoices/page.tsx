import Link from "next/link";
import type { Metadata } from "next";
import { Receipt } from "lucide-react";
import { StatTile } from "@/components/stat-tile";
import { InvoiceStatusControl } from "@/components/admin-invoice-control";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { dateOnly, moneyExact } from "@/lib/format";

export const metadata: Metadata = { title: "Invoices" };

interface Row {
  id: number;
  hammer_price: number;
  premium: number;
  total: number;
  status: string;
  created_at: number;
  title: string;
  slug: string;
  lot_no: string;
  buyer: string;
  buyer_email: string;
  paddle_no: string | null;
}

export default async function AdminInvoicesPage() {
  await requireAdmin();

  const rows = db
    .prepare(
      `SELECT i.*, l.title, l.slug, l.lot_no,
              u.name AS buyer, u.email AS buyer_email, u.paddle_no
         FROM invoices i
         JOIN lots  l ON l.id = i.lot_id
         JOIN users u ON u.id = i.user_id
        ORDER BY CASE i.status WHEN 'due' THEN 0 ELSE 1 END, i.created_at DESC`,
    )
    .all() as Row[];

  const totals = rows.reduce(
    (acc, r) => {
      if (r.status === "paid") acc.collected += r.total;
      if (r.status === "due") acc.outstanding += r.total;
      if (r.status !== "void") acc.premium += r.premium;
      return acc;
    },
    { collected: 0, outstanding: 0, premium: 0 },
  );

  return (
    <div>
      <div className="mb-6 border-b border-ink-100 pb-4">
        <h2 className="text-[26px]">Invoices</h2>
        <p className="mt-1 text-[13px] text-ink-400">
          Raised automatically when a lot sells. Mark paid once funds clear.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Invoices" value={String(rows.length)} icon={Receipt} />
        <StatTile label="Outstanding" value={moneyExact(totals.outstanding)} tone="warn" />
        <StatTile label="Collected" value={moneyExact(totals.collected)} tone="gain" />
        <StatTile label="Premium earned" value={moneyExact(totals.premium)} tone="brand" />
      </div>

      {rows.length === 0 ? (
        <p className="py-16 text-center text-[15px] text-ink-400">
          No invoices yet — they are raised when a lot sells.
        </p>
      ) : (
        <div className="card overflow-hidden">
          <div className="thin-scroll overflow-x-auto">
            <table className="w-full min-w-[920px] text-left">
              <thead>
                <tr className="border-b border-ink-100 text-[10px] uppercase tracking-[0.12em] text-ink-400">
                  <th className="px-4 py-3 font-bold">Invoice</th>
                  <th className="px-4 py-3 font-bold">Buyer</th>
                  <th className="px-4 py-3 text-right font-bold">Hammer</th>
                  <th className="px-4 py-3 text-right font-bold">Premium</th>
                  <th className="px-4 py-3 text-right font-bold">Total</th>
                  <th className="px-4 py-3 font-bold">Issued</th>
                  <th className="px-4 py-3 text-right font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="rows">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3">
                      <p className="num text-[11px] uppercase tracking-[0.1em] text-ink-400">
                        #{String(r.id).padStart(5, "0")} · Lot {r.lot_no}
                      </p>
                      <Link
                        href={`/lots/${r.slug}`}
                        className="block max-w-[220px] truncate text-[14px] font-medium hover:text-brand-500"
                      >
                        {r.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[14px]">{r.buyer}</p>
                      <p className="text-[12px] text-ink-400">
                        {r.paddle_no ? `Paddle ${r.paddle_no} · ` : ""}
                        {r.buyer_email}
                      </p>
                    </td>
                    <td className="num px-4 py-3 text-right text-[14px] tabular-nums">
                      {moneyExact(r.hammer_price)}
                    </td>
                    <td className="num px-4 py-3 text-right text-[14px] tabular-nums text-ink-500">
                      {moneyExact(r.premium)}
                    </td>
                    <td className="num px-4 py-3 text-right text-[15px] font-bold tabular-nums">
                      {moneyExact(r.total)}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-ink-400">
                      {dateOnly(r.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <InvoiceStatusControl invoiceId={r.id} status={r.status} />
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
