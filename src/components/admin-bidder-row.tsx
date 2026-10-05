"use client";

import { useState, useTransition } from "react";
import { Ban, Check, Loader2, RotateCcw, Settings2 } from "lucide-react";
import { dateOnly, money } from "@/lib/format";
import { setBidLimitAction, setBidderStatusAction } from "@/app/actions/admin";

export interface AdminBidder {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  role: string;
  bidder_status: string;
  bid_limit: number;
  paddle_no: string | null;
  created_at: number;
  bid_count: number;
  lots_won: number;
  total_spend: number;
}

export function BidderRow({ bidder }: { bidder: AdminBidder }) {
  const [pending, startTransition] = useTransition();
  const [editingLimit, setEditingLimit] = useState(false);
  const [limit, setLimit] = useState(
    bidder.bid_limit > 0 ? String(Math.round(bidder.bid_limit / 100)) : "",
  );

  const badge =
    bidder.bidder_status === "approved"
      ? "badge-sold"
      : bidder.bidder_status === "suspended"
        ? "badge-live"
        : "badge-ended";

  function act(fn: () => Promise<void>) {
    startTransition(async () => {
      await fn();
    });
  }

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-[220px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[16px] font-medium">{bidder.name}</h3>
            <span className={`badge ${badge}`}>{bidder.bidder_status}</span>
            {bidder.role === "admin" && <span className="badge badge-soon">Admin</span>}
            {bidder.bidder_status === "approved" && bidder.paddle_no && (
              <span className="badge badge-outline">Paddle {bidder.paddle_no}</span>
            )}
          </div>
          <p className="mt-1 text-[13px] text-ink-400">
            {bidder.email}
            {bidder.phone && ` · ${bidder.phone}`}
          </p>
          {bidder.company && <p className="text-[13px] text-ink-400">{bidder.company}</p>}
        </div>

        <dl className="flex flex-wrap justify-end gap-x-6 gap-y-2 text-right">
          <div>
            <dt className="text-[10px] uppercase tracking-[0.1em] text-ink-400">Bids</dt>
            <dd className="num text-[16px] font-medium tabular-nums">{bidder.bid_count}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.1em] text-ink-400">Won</dt>
            <dd className="num text-[16px] font-medium tabular-nums">{bidder.lots_won}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.1em] text-ink-400">Spend</dt>
            <dd className="num text-[16px] font-medium tabular-nums">
              {money(bidder.total_spend)}
            </dd>
          </div>
          <div className="min-w-[90px]">
            <dt className="text-[10px] uppercase tracking-[0.1em] text-ink-400">Bid limit</dt>
            <dd className="num text-[16px] font-medium tabular-nums">
              {bidder.bid_limit > 0 ? money(bidder.bid_limit) : "None"}
            </dd>
          </div>
          <div className="min-w-[90px]">
            <dt className="text-[10px] uppercase tracking-[0.1em] text-ink-400">Registered</dt>
            <dd className="text-[13px] text-ink-500">{dateOnly(bidder.created_at)}</dd>
          </div>
        </dl>

        <div className="flex gap-2">
          {bidder.bidder_status !== "approved" && (
            <button
              onClick={() => act(() => setBidderStatusAction(bidder.id, "approved"))}
              disabled={pending}
              className="btn btn-primary btn-sm"
            >
              {pending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              Approve
            </button>
          )}
          {bidder.bidder_status === "approved" && (
            <button
              onClick={() => act(() => setBidderStatusAction(bidder.id, "suspended"))}
              disabled={pending}
              className="btn btn-outline btn-sm"
            >
              <Ban size={13} /> Suspend
            </button>
          )}
          {bidder.bidder_status === "suspended" && (
            <button
              onClick={() => act(() => setBidderStatusAction(bidder.id, "pending"))}
              disabled={pending}
              className="btn btn-outline btn-sm"
            >
              <RotateCcw size={13} /> Reinstate
            </button>
          )}
          <button
            onClick={() => setEditingLimit((v) => !v)}
            className="btn btn-outline btn-sm"
            aria-expanded={editingLimit}
            title="Set a bid limit"
          >
            <Settings2 size={13} />
          </button>
        </div>
      </div>

      {editingLimit && (
        <div className="slide-up mt-4 flex flex-wrap items-end gap-3 rounded-sm border border-ink-100 bg-ink-50 p-3.5">
          <div>
            <label htmlFor={`limit-${bidder.id}`} className="label">
              Maximum bid permitted
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400">
                $
              </span>
              <input
                id={`limit-${bidder.id}`}
                inputMode="numeric"
                value={limit}
                onChange={(e) => setLimit(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="Unlimited"
                className="field num w-48 pl-8 tabular-nums"
              />
            </div>
          </div>
          <button
            onClick={() =>
              act(async () => {
                await setBidLimitAction(bidder.id, Number(limit) || 0);
                setEditingLimit(false);
              })
            }
            disabled={pending}
            className="btn btn-dark btn-sm"
          >
            {pending && <Loader2 size={13} className="animate-spin" />}
            Save limit
          </button>
          <p className="text-[12px] text-ink-400">
            Leave blank for no limit. A limit blocks any bid above it.
          </p>
        </div>
      )}
    </div>
  );
}
