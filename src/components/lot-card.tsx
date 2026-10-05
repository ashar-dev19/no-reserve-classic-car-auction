"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Gavel, Eye } from "lucide-react";
import { money, numberFmt } from "@/lib/format";
import { Countdown } from "./countdown";
import { useAuctionStream } from "./use-auction-stream";
import type { LotCardData } from "@/lib/lot-card-data";

export function LotCard({ lot, priority = false }: { lot: LotCardData; priority?: boolean }) {
  const [state, setState] = useState(lot);
  const [flash, setFlash] = useState(false);

  useEffect(() => setState(lot), [lot]);

  useAuctionStream(
    (event) => {
      if (event.type === "bid") {
        setState((s) => ({
          ...s,
          current_bid: event.currentBid,
          bid_count: event.bidCount,
          ends_at: event.endsAt,
          reserve_met: event.reserveMet,
          status: "live",
        }));
        setFlash(true);
        setTimeout(() => setFlash(false), 1100);
      } else if (event.type === "lot_closed") {
        setState((s) => ({ ...s, status: event.status, current_bid: event.hammer }));
      } else if (event.type === "lot_opened") {
        setState((s) => ({ ...s, status: "live", ends_at: event.endsAt }));
      }
    },
    { lotId: lot.id },
  );

  const open = state.status === "live" || state.status === "scheduled";
  const sold = state.status === "sold";
  const unsold = state.status === "unsold";
  const noBids = state.bid_count === 0;

  return (
    <article className="card card-hover group flex flex-col overflow-hidden">
      <Link href={`/lots/${state.slug}`} className="relative block aspect-[4/3] overflow-hidden img-ph">
        <Image
          src={state.image}
          alt={state.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={priority}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {state.status === "live" && (
            <span className="badge badge-live">
              <i className="pulse-dot" /> Live
            </span>
          )}
          {state.status === "scheduled" && <span className="badge badge-soon">Opens soon</span>}
          {sold && <span className="badge badge-sold">Sold</span>}
          {unsold && <span className="badge badge-ended">Not sold</span>}
          {!state.has_reserve && open && <span className="badge badge-noreserve">No Reserve</span>}
        </div>

        <span className="absolute right-3 top-3 rounded-xs bg-black/70 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur-sm">
          Lot {state.lot_no}
        </span>

        {open && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-2.5 pt-8">
            <Countdown endsAt={state.ends_at} className="text-[13px] font-bold !text-white" />
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[17px] leading-snug">
          <Link href={`/lots/${state.slug}`} className="transition-colors hover:text-brand-500">
            {state.title}
          </Link>
        </h3>

        {state.summary && (
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink-400">
            {state.summary}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-400">
          {state.mileage != null && <span>{numberFmt(state.mileage)} mi</span>}
          {state.location && <span>{state.location}</span>}
        </div>

        <div
          className={`mt-4 flex items-end justify-between gap-3 border-t border-ink-100 pt-3 ${
            flash ? "bid-flash" : ""
          }`}
        >
          <div>
            <p className="text-[11px] uppercase tracking-[0.1em] text-ink-400">
              {sold ? "Sold for" : unsold ? "High bid" : noBids ? "Starting bid" : "Current bid"}
            </p>
            <p className="num display text-[22px] font-bold leading-tight tabular-nums">
              {money(noBids ? state.starting_bid : state.current_bid)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-[12px] text-ink-400">
            <span className="flex items-center gap-1.5">
              <Gavel size={13} /> {state.bid_count}
            </span>
            {open && state.has_reserve === 1 && (
              <span
                className={`text-[10px] font-bold uppercase tracking-[0.08em] ${
                  state.reserve_met ? "text-gain" : "text-ink-400"
                }`}
              >
                {state.reserve_met ? "Reserve met" : "Reserve not met"}
              </span>
            )}
            {!open && (
              <span className="flex items-center gap-1.5">
                <Eye size={13} /> {numberFmt(state.view_count)}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
