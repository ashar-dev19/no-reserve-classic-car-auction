import { subscribe, type AuctionEvent } from "@/lib/events";
import { sweep } from "@/lib/auction";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Server-sent events feed for live auction updates.
 *
 * One connection per browser tab carries every lot's traffic; clients filter by
 * `lotId`. SSE rather than websockets because the flow is one-directional —
 * bids go up over an ordinary action call — and it reconnects by itself.
 */
export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const send = (payload: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          closed = true;
        }
      };

      const sendEvent = (event: AuctionEvent) =>
        send(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);

      send(`retry: 3000\n\n`);
      send(`event: ready\ndata: ${JSON.stringify({ at: Date.now() })}\n\n`);

      const unsubscribe = subscribe(sendEvent);

      // Lots close on their own schedule, with or without traffic. Sweeping on a
      // ticker is what turns "time ran out" into a settled lot and a broadcast.
      const ticker = setInterval(() => {
        try {
          sweep();
        } catch (err) {
          console.error("[stream] sweep failed", err);
        }
        send(`event: tick\ndata: ${JSON.stringify({ at: Date.now() })}\n\n`);
      }, 5_000);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(ticker);
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      request.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
