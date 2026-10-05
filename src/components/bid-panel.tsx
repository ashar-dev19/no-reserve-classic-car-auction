"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Gavel, Info, Loader2, TrendingUp } from "lucide-react";
import { money } from "@/lib/format";
import { increment, nextMinimumBid, quickBidOptions } from "@/lib/increments";
import { placeBidAction } from "@/app/actions/bidding";
import { CountdownBlocks } from "./countdown";
import { useAuctionStream } from "./use-auction-stream";
import type { PublicUser } from "@/lib/types";

interface Props {
  lotId: number;
  lotNo: string;
  initialCurrentBid: number;
  initialBidCount: number;
  initialEndsAt: number;
  startingBid: number;
  hasReserve: boolean;
  initialReserveMet: boolean;
  initialStatus: string;
  initialHighBidderId: number | null;
  initialHighBidderName: string | null;
  estimateLow: number | null;
  estimateHigh: number | null;
  buyersPremiumBps: number;
  user: PublicUser | null;
}

type Feedback = { tone: "ok" | "warn" | "error"; text: string } | null;

export function BidPanel(props: Props) {
  const [currentBid, setCurrentBid] = useState(props.initialCurrentBid);
  const [bidCount, setBidCount] = useState(props.initialBidCount);
  const [endsAt, setEndsAt] = useState(props.initialEndsAt);
  const [reserveMet, setReserveMet] = useState(props.initialReserveMet);
  const [status, setStatus] = useState(props.initialStatus);
  const [highBidderId, setHighBidderId] = useState(props.initialHighBidderId);
  const [highBidderName, setHighBidderName] = useState(props.initialHighBidderName);
  const [extendedAt, setExtendedAt] = useState<number | null>(null);

  const [amount, setAmount] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [flash, setFlash] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const connected = useAuctionStream(
    (event) => {
      if (event.type === "bid") {
        setCurrentBid(event.currentBid);
        setBidCount(event.bidCount);
        setEndsAt(event.endsAt);
        setReserveMet(event.reserveMet);
        setHighBidderId(event.highBidderId);
        setHighBidderName(event.highBidderName);
        setStatus("live");
        if (event.extended) {
          setExtendedAt(event.at);
          setTimeout(() => setExtendedAt(null), 8000);
        }
        setFlash(true);
        setTimeout(() => setFlash(false), 1100);
      } else if (event.type === "lot_closed") {
        setStatus(event.status);
        setCurrentBid(event.hammer);
        setHighBidderId(event.winnerId);
        setHighBidderName(event.winnerName);
      } else if (event.type === "lot_opened") {
        setStatus("live");
        setEndsAt(event.endsAt);
      }
    },
    { lotId: props.lotId },
  );

  const minimum = nextMinimumBid({
    current_bid: currentBid,
    bid_count: bidCount,
    starting_bid: props.startingBid,
  });

  // Keep the field on the minimum until the bidder types their own number.
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (!touched) setAmount(String(Math.round(minimum / 100)));
  }, [minimum, touched]);

  const closed = status === "sold" || status === "unsold";
  const isHighBidder = props.user != null && highBidderId === props.user.id;
  const approved = props.user?.bidder_status === "approved";
  const premium = Math.round((currentBid * props.buyersPremiumBps) / 10_000);

  function submit(dollars: number) {
    setFeedback(null);
    startTransition(async () => {
      const result = await placeBidAction(props.lotId, dollars);
      if (result.ok) {
        setFeedback({
          tone: result.status === "outbid" ? "warn" : "ok",
          text: result.message,
        });
        setTouched(false);
      } else {
        setFeedback({ tone: "error", text: result.message });
      }
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const dollars = Number(amount.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(dollars) || dollars <= 0) {
      setFeedback({ tone: "error", text: "Enter a bid amount." });
      inputRef.current?.focus();
      return;
    }
    submit(dollars);
  }

  return (
    <div className="card sticky top-[88px] overflow-hidden">
      {/* Status bar */}
      <div className="flex items-center justify-between gap-3 border-b border-ink-100 bg-ink-50 px-5 py-3">
        <span className="display text-[12px] font-bold uppercase tracking-[0.12em] text-ink-500">
          Lot {props.lotNo}
        </span>
        <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.1em]">
          {closed ? (
            <span className={status === "sold" ? "text-gain" : "text-ink-400"}>
              {status === "sold" ? "Sold" : "Not sold"}
            </span>
          ) : (
            <>
              <i
                className={`pulse-dot ${connected ? "text-brand-500" : "text-ink-300"}`}
                title={connected ? "Live updates connected" : "Reconnecting"}
              />
              <span className="text-brand-500">Live</span>
            </>
          )}
        </span>
      </div>

      <div className="p-5">
        {/* Price */}
        <div className={flash ? "bid-flash -mx-2 rounded-sm px-2" : "-mx-2 px-2"}>
          <p className="text-[11px] uppercase tracking-[0.12em] text-ink-400">
            {closed ? (status === "sold" ? "Hammer price" : "High bid") : bidCount === 0 ? "Starting bid" : "Current bid"}
          </p>
          <p className="num display text-[40px] font-bold leading-none tabular-nums">
            {money(bidCount === 0 && !closed ? props.startingBid : currentBid)}
          </p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-400">
            <span>
              {bidCount} {bidCount === 1 ? "bid" : "bids"}
            </span>
            {highBidderName && (
              <span className="flex items-center gap-1.5">
                <TrendingUp size={13} />
                {isHighBidder ? "You are the high bidder" : `High: ${highBidderName}`}
              </span>
            )}
          </p>
        </div>

        {/* Reserve */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!props.hasReserve ? (
            <span className="badge badge-noreserve">No Reserve — sells to the high bid</span>
          ) : reserveMet ? (
            <span className="badge badge-sold">
              <CheckCircle2 size={11} /> Reserve met
            </span>
          ) : (
            <span className="badge badge-outline">Reserve not yet met</span>
          )}
          {props.estimateLow != null && props.estimateHigh != null && (
            <span className="badge badge-outline">
              Est. {money(props.estimateLow)} – {money(props.estimateHigh)}
            </span>
          )}
        </div>

        {/* Clock */}
        <div className="mt-6 border-t border-ink-100 pt-5">
          <p className="mb-2 text-[11px] uppercase tracking-[0.12em] text-ink-400">
            {closed ? "Closed" : "Closes in"}
          </p>
          <CountdownBlocks endsAt={endsAt} />
          {extendedAt && (
            <p className="slide-up mt-3 flex items-center gap-2 rounded-sm bg-brand-50 px-3 py-2 text-[12px] font-medium text-brand-600">
              <AlertCircle size={14} /> Late bid — clock extended by two minutes.
            </p>
          )}
        </div>

        {/* Bid form */}
        {closed ? (
          <div className="mt-6 rounded-sm border border-ink-100 bg-ink-50 p-4 text-[13px] leading-relaxed text-ink-500">
            {status === "sold" ? (
              <>
                This lot sold for <strong className="text-ink-900">{money(currentBid)}</strong>
                {highBidderName && <> to {isHighBidder ? "you" : highBidderName}</>}.
                {isHighBidder && (
                  <>
                    {" "}
                    <Link href="/dashboard/invoices" className="text-brand-500 underline">
                      View your invoice
                    </Link>
                    .
                  </>
                )}
              </>
            ) : (
              <>Bidding closed at {money(currentBid)} without meeting the reserve.</>
            )}
          </div>
        ) : !props.user ? (
          <div className="mt-6">
            <Link href={`/login?next=/lots`} className="btn btn-primary w-full">
              Sign In to Bid
            </Link>
            <p className="mt-3 text-center text-[13px] text-ink-400">
              No account?{" "}
              <Link href="/register" className="text-brand-500 underline">
                Register to bid
              </Link>
            </p>
          </div>
        ) : !approved ? (
          <div className="mt-6 rounded-sm border border-ink-100 bg-ink-50 p-4">
            <p className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-600">
              <Info size={15} className="mt-0.5 shrink-0 text-amber-ac" />
              {props.user.bidder_status === "suspended"
                ? "Your bidding privileges are suspended. Contact the auction office on (800) 562-7815."
                : "Your bidder registration is under review. We approve most registrations within one business day, and you'll be notified the moment yours clears."}
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6">
            <label htmlFor="bid-amount" className="label">
              Your maximum bid
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-ink-400">
                  $
                </span>
                <input
                  id="bid-amount"
                  ref={inputRef}
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => {
                    setTouched(true);
                    setAmount(e.target.value.replace(/[^0-9]/g, ""));
                  }}
                  className="field num pl-8 tabular-nums"
                  aria-describedby="bid-help"
                />
              </div>
              <button type="submit" className="btn btn-primary px-6" disabled={pending}>
                {pending ? <Loader2 size={15} className="animate-spin" /> : <Gavel size={15} />}
                {pending ? "Placing" : "Place Bid"}
              </button>
            </div>

            <p id="bid-help" className="mt-2 text-[12px] text-ink-400">
              Minimum {money(minimum)} · increments of {money(increment(currentBid || props.startingBid))}
            </p>

            <div className="mt-3 flex gap-2">
              {quickBidOptions(minimum).map((option) => (
                <button
                  key={option}
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    setTouched(true);
                    setAmount(String(Math.round(option / 100)));
                    submit(option / 100);
                  }}
                  className="num flex-1 rounded-sm border border-ink-200 py-2 text-[13px] font-medium tabular-nums transition-colors hover:border-ink-900 hover:bg-ink-50 disabled:opacity-50"
                >
                  {money(option)}
                </button>
              ))}
            </div>

            <p className="mt-3 flex items-start gap-1.5 text-[12px] leading-relaxed text-ink-400">
              <Info size={13} className="mt-0.5 shrink-0" />
              We bid on your behalf up to your maximum, one increment at a time. Your ceiling is
              never shown to other bidders.
            </p>
          </form>
        )}

        {feedback && (
          <p
            role="status"
            className={`slide-up mt-4 flex items-start gap-2 rounded-sm px-3 py-2.5 text-[13px] leading-relaxed ${
              feedback.tone === "ok"
                ? "bg-gain-soft text-gain"
                : feedback.tone === "warn"
                  ? "bg-[#fff6e8] text-[#9a5b00]"
                  : "bg-brand-50 text-brand-600"
            }`}
          >
            {feedback.tone === "ok" ? (
              <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
            )}
            {feedback.text}
          </p>
        )}

        {/* Cost breakdown */}
        {!closed && bidCount > 0 && (
          <dl className="mt-6 space-y-1.5 border-t border-ink-100 pt-4 text-[13px]">
            <div className="flex justify-between text-ink-400">
              <dt>Current bid</dt>
              <dd className="num tabular-nums">{money(currentBid)}</dd>
            </div>
            <div className="flex justify-between text-ink-400">
              <dt>Buyer's premium ({props.buyersPremiumBps / 100}%)</dt>
              <dd className="num tabular-nums">{money(premium)}</dd>
            </div>
            <div className="flex justify-between border-t border-ink-100 pt-1.5 font-medium text-ink-900">
              <dt>Total at this price</dt>
              <dd className="num tabular-nums">{money(currentBid + premium)}</dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
