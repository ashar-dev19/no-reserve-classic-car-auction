import { EventEmitter } from "node:events";

export type AuctionEvent =
  | {
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
  | {
      type: "lot_opened";
      lotId: number;
      lotSlug: string;
      endsAt: number;
      at: number;
    }
  | {
      type: "lot_closed";
      lotId: number;
      lotSlug: string;
      status: "sold" | "unsold";
      hammer: number;
      winnerId: number | null;
      winnerName: string | null;
      at: number;
    }
  | {
      type: "comment";
      lotId: number;
      lotSlug: string;
      at: number;
    };

declare global {
  // eslint-disable-next-line no-var
  var __auctionBus: EventEmitter | undefined;
}

/**
 * Single in-process fan-out for live auction updates. Survives HMR in dev by
 * living on globalThis. For multi-node deployments this is the seam to swap for
 * Redis pub/sub — every publisher already goes through `publish`.
 */
const bus: EventEmitter = globalThis.__auctionBus ?? new EventEmitter();
bus.setMaxListeners(0);
if (process.env.NODE_ENV !== "production") globalThis.__auctionBus = bus;

export function publish(event: AuctionEvent): void {
  bus.emit("auction", event);
}

export function subscribe(listener: (event: AuctionEvent) => void): () => void {
  bus.on("auction", listener);
  return () => {
    bus.off("auction", listener);
  };
}
