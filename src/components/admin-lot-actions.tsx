"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Hammer, Loader2, Pencil, Trash2 } from "lucide-react";
import { closeLotNowAction, deleteLotAction } from "@/app/actions/admin";

export function AdminLotActions({
  lotId,
  slug,
  status,
  bidCount,
}: {
  lotId: number;
  slug: string;
  status: string;
  bidCount: number;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const open = status === "live" || status === "scheduled";

  if (confirming) {
    return (
      <div className="slide-up flex items-center gap-2 rounded-sm border border-brand-500 bg-brand-50 px-3 py-2">
        <p className="text-[12px] leading-snug text-brand-600">
          {bidCount > 0
            ? "This lot has bids — it will be withdrawn, not deleted."
            : "Delete this lot permanently?"}
        </p>
        <button
          onClick={() => startTransition(() => deleteLotAction(lotId).then(() => setConfirming(false)))}
          disabled={pending}
          className="btn btn-primary btn-sm"
        >
          {pending && <Loader2 size={13} className="animate-spin" />}
          {bidCount > 0 ? "Withdraw" : "Delete"}
        </button>
        <button onClick={() => setConfirming(false)} className="btn btn-outline btn-sm">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-1.5">
      <Link href={`/admin/lots/${slug}`} className="btn btn-outline btn-sm">
        <Pencil size={13} /> Edit
      </Link>
      {open && (
        <button
          onClick={() => startTransition(() => closeLotNowAction(lotId))}
          disabled={pending}
          className="btn btn-outline btn-sm"
          title="Settle this lot now"
        >
          {pending ? <Loader2 size={13} className="animate-spin" /> : <Hammer size={13} />}
        </button>
      )}
      <button
        onClick={() => setConfirming(true)}
        className="btn btn-outline btn-sm text-brand-500"
        title={bidCount > 0 ? "Withdraw lot" : "Delete lot"}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
