"use client";

import { useEffect, useState } from "react";
import { Bot, Gavel } from "lucide-react";
import { money, relativeTime } from "@/lib/format";
import { useAuctionStream, useTicker } from "./use-auction-stream";

export interface BidRowData {
  id: number;
  amount: number;
  is_auto: number;
  created_at: number;
  bidder_name: string;
  paddle_no: string | null;
  user_id: number;
}

export function BidHistory({
  lotId,
  initial,
  currentUserId,
}: {
  lotId: number;
  initial: BidRowData[];
  currentUserId: number | null;
}) {
  const [rows, setRows] = useState(initial);
  const [justAdded, setJustAdded] = useState<number | null>(null);
  useTicker(15_000); // keeps "2m ago" honest without hammering the server

  useEffect(() => setRows(initial), [initial]);

  useAuctionStream(
    (event) => {
      if (event.type !== "bid") return;
      // The engine may have written two rows (a proxy duel); refetch rather than
      // guess, so the ladder shown always matches what was recorded.
      fetch(`/api/lots/${lotId}/bids`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { bids: BidRowData[] } | null) => {
          if (!data) return;
          setRows(data.bids);
          setJustAdded(data.bids[0]?.id ?? null);
          setTimeout(() => setJustAdded(null), 1200);
        })
        .catch(() => {});
    },
    { lotId },
  );

  if (rows.length === 0) {
    return (
      <div className="card p-8 text-center">
        <Gavel size={22} className="mx-auto text-ink-200" />
        <p className="mt-3 text-[14px] text-ink-400">No bids yet. Be the first.</p>
      </div>
    );
  }

  return (
    <div className="card thin-scroll max-h-[460px] overflow-y-auto">
      <div className="rows">
        {rows.map((bid) => {
          const mine = currentUserId != null && bid.user_id === currentUserId;
          return (
            <div
              key={bid.id}
              className={`flex items-center justify-between gap-4 px-4 py-3 ${
                justAdded === bid.id ? "bid-flash" : ""
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                    mine ? "bg-brand-500 text-white" : "bg-ink-100 text-ink-500"
                  }`}
                >
                  {bid.is_auto ? <Bot size={14} /> : bid.bidder_name.slice(0, 1)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium">
                    {mine ? "You" : maskName(bid.bidder_name)}
                    {bid.paddle_no && (
                      <span className="ml-2 text-[12px] font-normal text-ink-400">
                        Paddle {bid.paddle_no}
                      </span>
                    )}
                  </p>
                  <p className="text-[12px] text-ink-400">
                    {relativeTime(bid.created_at)}
                    {bid.is_auto === 1 && " · automatic bid"}
                  </p>
                </div>
              </div>
              <p className="num display shrink-0 text-[17px] font-bold tabular-nums">
                {money(bid.amount)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Bidders see first name and last initial, the way a saleroom board reads. */
function maskName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!;
  return `${parts[0]} ${parts[parts.length - 1]![0]}.`;
}
