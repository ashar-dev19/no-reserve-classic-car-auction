import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Receipt } from "lucide-react";
import { EmptyState } from "@/components/stat-tile";
import { requireUser } from "@/lib/auth";
import { getInvoices } from "@/lib/queries";
import { safeFirstImage } from "@/lib/queries";
import { dateOnly, moneyExact } from "@/lib/format";

export const metadata: Metadata = { title: "Invoices" };

export default async function InvoicesPage() {
  const user = await requireUser();
  const invoices = getInvoices(user.id);

  if (invoices.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No invoices"
        body="When you win a lot, the invoice is issued here the moment it closes — hammer price, buyer's premium and total."
        action={{ href: "/lots?status=live", label: "Browse live lots" }}
      />
    );
  }

  const outstanding = invoices
    .filter((i) => i.status === "due")
    .reduce((sum, i) => sum + i.total, 0);

  return (
    <div className="space-y-8">
      {outstanding > 0 && (
        <div className="card flex flex-wrap items-center justify-between gap-5 border-l-[3px] border-l-amber-ac bg-[#fffaf2] p-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-ink-400">
              Outstanding balance
            </p>
            <p className="num display mt-1 text-[30px] font-bold leading-none">
              {moneyExact(outstanding)}
            </p>
          </div>
          <p className="max-w-md text-[13px] leading-relaxed text-ink-500">
            Payable by wire within five business days of the sale. Wire instructions are on each
            invoice; the office can take you through it on (800) 562-7815.
          </p>
        </div>
      )}

      <section>
        <h2 className="mb-5 border-b border-ink-100 pb-4 text-[24px]">Invoices</h2>

        <div className="space-y-4">
          {invoices.map((inv) => (
            <article key={inv.id} className="card overflow-hidden">
              <div className="flex flex-wrap items-center gap-4 border-b border-ink-100 p-4">
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-sm img-ph">
                  <Image
                    src={safeFirstImage(inv.images)}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-[180px] flex-1">
                  <p className="text-[11px] uppercase tracking-[0.1em] text-ink-400">
                    Invoice #{String(inv.id).padStart(5, "0")} · Lot {inv.lot_no}
                  </p>
                  <h3 className="text-[18px] leading-snug">
                    <Link href={`/lots/${inv.slug}`} className="hover:text-brand-500">
                      {inv.title}
                    </Link>
                  </h3>
                  <p className="mt-0.5 text-[12px] text-ink-400">
                    Issued {dateOnly(inv.created_at)}
                  </p>
                </div>
                <span
                  className={`badge shrink-0 ${
                    inv.status === "paid"
                      ? "badge-sold"
                      : inv.status === "void"
                        ? "badge-ended"
                        : "badge-noreserve"
                  }`}
                >
                  {inv.status === "due" ? "Payment due" : inv.status}
                </span>
              </div>

              <dl className="grid gap-x-8 gap-y-2 p-4 sm:grid-cols-3">
                <div className="flex justify-between gap-4 sm:block">
                  <dt className="text-[12px] uppercase tracking-[0.08em] text-ink-400">
                    Hammer price
                  </dt>
                  <dd className="num text-[16px] font-medium tabular-nums sm:mt-1">
                    {moneyExact(inv.hammer_price)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 sm:block">
                  <dt className="text-[12px] uppercase tracking-[0.08em] text-ink-400">
                    Buyer's premium
                  </dt>
                  <dd className="num text-[16px] font-medium tabular-nums sm:mt-1">
                    {moneyExact(inv.premium)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-ink-100 pt-2 sm:block sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                  <dt className="text-[12px] uppercase tracking-[0.08em] text-ink-400">
                    Total due
                  </dt>
                  <dd className="num display text-[22px] font-bold tabular-nums sm:mt-1">
                    {moneyExact(inv.total)}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
