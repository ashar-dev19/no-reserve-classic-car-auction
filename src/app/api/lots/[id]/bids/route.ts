import { getBids } from "@/lib/auction";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const lotId = Number(id);
  if (!Number.isInteger(lotId)) {
    return Response.json({ error: "Invalid lot id" }, { status: 400 });
  }

  const bids = getBids(lotId, 100).map((b) => ({
    id: b.id,
    amount: b.amount,
    is_auto: b.is_auto,
    created_at: b.created_at,
    bidder_name: b.bidder_name,
    paddle_no: b.paddle_no,
    user_id: b.user_id,
    // max_amount is deliberately omitted — a bidder's ceiling is private.
  }));

  return Response.json({ bids }, { headers: { "Cache-Control": "no-store" } });
}
