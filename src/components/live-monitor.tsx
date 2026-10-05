"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Clock, Loader2, Hammer } from "lucide-react";
import { money } from "@/lib/format";
import { Countdown } from "./countdown";
import { useAuctionStream } from "./use-auction-stream";
import { closeLotNowAction, extendLotAction } from "@/app/actions/admin";

export interface MonitorLot {
  id: number;
  slug: string;
  lot_no: string;
  title: string;
  current_bid: number;
  starting_bid: number;
  bid_count: number;
  ends_at: number;
  reserve: number | null;
  has_reserve: number;
  reserve_met: boolean;
  high_bidder_name: string | null;
}

export function LiveMonitor({ lots }: { lots: MonitorLot[] }) {
  const [rows, setRows] = useState(lots);
  const [flashed, setFlashed] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => setRows(lots), [lots]);

  const connected = useAuctionStream((event) => {
    if (event.type === "bid") {
      setRows((rs) =>
        rs.map((r) =>
          r.id === event.lotId
            ? {
                ...r,
                current_bid: event.currentBid,
                bid_count: event.bidCount,
                ends_at: event.endsAt,
                reserve_met: event.reserveMet,
                high_bidder_name: event.highBidderName,
              }
            : r,
        ),
      );
      setFlashed(event.lotId);
      setTimeout(() => setFlashed(null), 1100);
    } else if (event.type === "lot_closed") {
      setRows((rs) => rs.filter((r) => r.id !== event.lotId));
    }
  });

  function run(lotId: number, fn: () => Promise<void>) {
    setBusy(lotId);
    startTransition(async () => {
      await fn();
      setBusy(null);
    });
  }

  if (rows.length === 0) {
    return (
      <div className="card p-10 text-center">
        <Clock size={24} className="mx-auto text-ink-200" />
        <p className="mt-3 text-[14px] text-ink-400">No lots are live right now.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink-100 bg-ink-50 px-4 py-2.5">
        <span className="display text-[11px] font-bold uppercase tracking-[0.12em] text-ink-500">
          {rows.length} lots on the clock
        </span>
        <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.1em] text-ink-400">
          <i className={`pulse-dot ${connected ? "text-gain" : "text-ink-300"}`} />
          {connected ? "Connected" : "Reconnecting"}
        </span>
      </div>

      <div className="thin-scroll overflow-x-auto">
        <table className="w-full min-w-[820px] text-left">
          <thead>
            <tr className="border-b border-ink-100 text-[10px] uppercase tracking-[0.12em] text-ink-400">
              <th className="px-4 py-2.5 font-bold">Lot</th>
              <th className="px-4 py-2.5 font-bold">Current</th>
              <th className="px-4 py-2.5 font-bold">Bids</th>
              <th className="px-4 py-2.5 font-bold">High bidder</th>
              <th className="px-4 py-2.5 font-bold">Reserve</th>
              <th className="px-4 py-2.5 font-bold">Closes</th>
              <th className="px-4 py-2.5 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="rows">
            {rows.map((lot) => (
              <tr key={lot.id} className={flashed === lot.id ? "bid-flash" : ""}>
                <td className="px-4 py-3">
                  <Link href={`/lots/${lot.slug}`} className="hover:text-brand-500">
                    <span className="block text-[11px] uppercase tracking-[0.1em] text-ink-400">
                      {lot.lot_no}
                    </span>
                    <span className="block max-w-[220px] truncate text-[14px] font-medium">
                      {lot.title}
                    </span>
                  </Link>
                </td>
                <td className="num px-4 py-3 text-[15px] font-bold tabular-nums">
                  {money(lot.bid_count === 0 ? lot.starting_bid : lot.current_bid)}
                </td>
                <td className="num px-4 py-3 text-[14px] tabular-nums text-ink-500">
                  {lot.bid_count}
                </td>
                <td className="max-w-[140px] truncate px-4 py-3 text-[14px] text-ink-500">
                  {lot.high_bidder_name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {lot.has_reserve === 0 ? (
                    <span className="badge badge-noreserve">None</span>
                  ) : lot.reserve_met ? (
                    <span className="badge badge-sold">Met</span>
                  ) : (
                    <span className="num text-[13px] text-ink-400">
                      {money(lot.reserve)} needed
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Countdown endsAt={lot.ends_at} className="text-[14px] font-medium" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => run(lot.id, () => extendLotAction(lot.id, 10))}
                      disabled={busy === lot.id}
                      className="btn btn-outline btn-sm"
                      title="Push the close time out by 10 minutes"
                    >
                      {busy === lot.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Clock size={13} />
                      )}
                      +10m
                    </button>
                    <button
                      onClick={() => run(lot.id, () => closeLotNowAction(lot.id))}
                      disabled={busy === lot.id}
                      className="btn btn-dark btn-sm"
                      title="Settle this lot immediately"
                    >
                      <Hammer size={13} /> Close
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
