import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { AdminLotForm } from "@/components/admin-lot-form";
import { requireAdmin } from "@/lib/auth";
import { getLotBySlug } from "@/lib/auction";
import { getAuctions } from "@/lib/queries";
import { availableImages } from "@/lib/images";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lot = getLotBySlug(slug);
  return { title: lot ? `Edit · ${lot.title}` : "Edit Lot" };
}

export default async function EditLotPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  const lot = getLotBySlug(slug);
  if (!lot) notFound();

  const auctions = getAuctions();

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin/lots"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-ink-400 hover:text-ink-900"
      >
        <ChevronLeft size={15} /> Back to lots
      </Link>

      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.1em] text-ink-400">Lot {lot.lot_no}</p>
          <h2 className="mt-1 text-[28px] leading-tight">{lot.title}</h2>
          <p className="mt-1.5 text-[13px] text-ink-400">
            {lot.bid_count} bids · {lot.status}
          </p>
        </div>
        <Link href={`/lots/${lot.slug}`} className="btn btn-outline btn-sm">
          <ExternalLink size={14} /> View public page
        </Link>
      </div>

      <AdminLotForm
        lot={lot}
        auctions={auctions.map((a) => ({ id: a.id, title: a.title }))}
        imageChoices={availableImages()}
      />
    </div>
  );
}
