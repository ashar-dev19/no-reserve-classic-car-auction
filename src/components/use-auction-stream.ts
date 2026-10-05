"use client";

import { useEffect, useRef, useState } from "react";

export interface BidEvent {
  type: "bid";
  lotId: number;
  lotSlug: string;
  currentBid: number;
  bidCount: number;
  endsAt: number;
  extended: boolean;
  reserveMet: boolean;
  highBidderId: number;
  highBidderName: string;
  at: number;
}

export interface ClosedEvent {
  type: "lot_closed";
  lotId: number;
  lotSlug: string;
  status: "sold" | "unsold";
  hammer: number;
  winnerId: number | null;
  winnerName: string | null;
  at: number;
}

export interface OpenedEvent {
  type: "lot_opened";
  lotId: number;
  lotSlug: string;
  endsAt: number;
  at: number;
}

export interface CommentEvent {
  type: "comment";
  lotId: number;
  lotSlug: string;
  at: number;
}

export type StreamEvent = BidEvent | ClosedEvent | OpenedEvent | CommentEvent;

type Handler = (event: StreamEvent) => void;

/**
 * One EventSource shared by every component on the page. Mounting a second
 * subscriber reuses the open connection instead of asking the server for
 * another, which matters on grid pages with thirty live cards.
 */
let source: EventSource | null = null;
let refCount = 0;
const handlers = new Set<Handler>();
const connectionListeners = new Set<(connected: boolean) => void>();

function setConnected(value: boolean) {
  connectionListeners.forEach((fn) => fn(value));
}

function acquire(): void {
  refCount++;
  if (source) return;
  source = new EventSource("/api/stream");
  source.addEventListener("open", () => setConnected(true));
  source.addEventListener("error", () => setConnected(false));
  source.addEventListener("ready", () => setConnected(true));
  for (const name of ["bid", "lot_closed", "lot_opened", "comment"] as const) {
    source.addEventListener(name, (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data) as StreamEvent;
        handlers.forEach((fn) => fn(data));
      } catch {
        /* ignore malformed frame */
      }
    });
  }
}

function release(): void {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0 && source) {
    source.close();
    source = null;
    setConnected(false);
  }
}

export function useAuctionStream(onEvent: Handler, options?: { lotId?: number }): boolean {
  const [connected, setConnectedState] = useState(false);
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;
  const lotId = options?.lotId;

  useEffect(() => {
    const handler: Handler = (event) => {
      if (lotId != null && "lotId" in event && event.lotId !== lotId) return;
      handlerRef.current(event);
    };
    handlers.add(handler);
    connectionListeners.add(setConnectedState);
    acquire();

    return () => {
      handlers.delete(handler);
      connectionListeners.delete(setConnectedState);
      release();
    };
  }, [lotId]);

  return connected;
}

/** Re-renders roughly once a second, for countdowns that must stay honest. */
export function useTicker(intervalMs = 1000): number {
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return tick;
}
