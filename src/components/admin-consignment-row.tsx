"use client";

import { useTransition } from "react";
import { Check, Eye, Loader2, X } from "lucide-react";
import { dateOnly, numberFmt } from "@/lib/format";
import { setConsignmentStatusAction } from "@/app/actions/admin";
import type { ConsignmentRecord } from "@/app/admin/consignments/page";

const BADGE: Record<string, string> = {
  new: "badge-live",
  reviewing: "badge-soon",
  accepted: "badge-sold",
  declined: "badge-ended",
};

export function ConsignmentRow({ record }: { record: ConsignmentRecord }) {
  const [pending, startTransition] = useTransition();

  const set = (status: string) =>
    startTransition(() => setConsignmentStatusAction(record.id, status));

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-[240px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[17px] font-medium">
              {record.year} {record.make} {record.model}
            </h3>
            <span className={`badge ${BADGE[record.status] ?? "badge-outline"}`}>
              {record.status}
            </span>
            {record.reserve_pref === "no-reserve" && (
              <span className="badge badge-noreserve">Wants no reserve</span>
            )}
          </div>

          <p className="mt-1 text-[13px] text-ink-400">
            {record.name} · {record.email}
            {record.phone && ` · ${record.phone}`}
          </p>
          <p className="mt-0.5 text-[12px] text-ink-400">
            {record.mileage != null && `${numberFmt(record.mileage)} mi · `}
            Submitted {dateOnly(record.created_at)}
          </p>

          {record.notes && (
            <p className="mt-2.5 max-w-2xl whitespace-pre-wrap rounded-sm border border-ink-100 bg-ink-50 px-3 py-2 text-[13px] leading-relaxed text-ink-600">
              {record.notes}
            </p>
          )}
        </div>

        <div className="flex gap-1.5">
          {record.status !== "reviewing" && record.status !== "accepted" && (
            <button
              onClick={() => set("reviewing")}
              disabled={pending}
              className="btn btn-outline btn-sm"
            >
              {pending ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
              Reviewing
            </button>
          )}
          {record.status !== "accepted" && (
            <button
              onClick={() => set("accepted")}
              disabled={pending}
              className="btn btn-primary btn-sm"
            >
              <Check size={13} /> Accept
            </button>
          )}
          {record.status !== "declined" && (
            <button
              onClick={() => set("declined")}
              disabled={pending}
              className="btn btn-outline btn-sm"
            >
              <X size={13} /> Decline
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
