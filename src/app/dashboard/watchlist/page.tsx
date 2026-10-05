import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { LotCard } from "@/components/lot-card";
import { toCardData } from "@/lib/lot-card-data";
import { EmptyState } from "@/components/stat-tile";
import { requireUser } from "@/lib/auth";
import { getWatchlist } from "@/lib/queries";
import { sweep } from "@/lib/auction";

export const metadata: Metadata = { title: "Watchlist" };

export default async function WatchlistPage() {
  sweep();
  const user = await requireUser();
  const lots = getWatchlist(user.id);

  if (lots.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Nothing saved yet"
        body="Tap Watch on any lot and it lands here, with live prices and a countdown you can keep an eye on."
        action={{ href: "/lots", label: "Browse the catalogue" }}
      />
    );
  }

  return (
    <>
      <h2 className="mb-6 border-b border-ink-100 pb-4 text-[24px]">
        Watching <span className="text-ink-300">({lots.length})</span>
      </h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {lots.map((lot) => (
          <LotCard key={lot.id} lot={toCardData(lot)} />
        ))}
      </div>
    </>
  );
}
