import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { AdminLotForm } from "@/components/admin-lot-form";
import { requireAdmin } from "@/lib/auth";
import { getAuctions } from "@/lib/queries";
import { availableImages } from "@/lib/images";

export const metadata: Metadata = { title: "New Lot" };

export default async function NewLotPage() {
  await requireAdmin();
  const auctions = getAuctions();

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin/lots"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-ink-400 hover:text-ink-900"
      >
        <ChevronLeft size={15} /> Back to lots
      </Link>

      <h2 className="mb-7 text-[28px]">New lot</h2>

      <AdminLotForm
        lot={null}
        auctions={auctions.map((a) => ({ id: a.id, title: a.title }))}
        imageChoices={availableImages()}
      />
    </div>
  );
}
