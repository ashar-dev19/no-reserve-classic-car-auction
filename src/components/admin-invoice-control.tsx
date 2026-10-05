"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { setInvoiceStatusAction } from "@/app/actions/admin";

const BADGE: Record<string, string> = {
  due: "badge-noreserve",
  paid: "badge-sold",
  void: "badge-ended",
};

export function InvoiceStatusControl({
  invoiceId,
  status,
}: {
  invoiceId: number;
  status: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-end gap-2">
      <span className={`badge ${BADGE[status] ?? "badge-outline"}`}>
        {status === "due" ? "Payment due" : status}
      </span>
      {pending ? (
        <Loader2 size={14} className="animate-spin text-ink-400" />
      ) : (
        <select
          value={status}
          onChange={(e) =>
            startTransition(() => setInvoiceStatusAction(invoiceId, e.target.value))
          }
          aria-label="Change invoice status"
          className="field h-8 w-[88px] text-[12px]"
        >
          <option value="due">Due</option>
          <option value="paid">Paid</option>
          <option value="void">Void</option>
        </select>
      )}
    </div>
  );
}
