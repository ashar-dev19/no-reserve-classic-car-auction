import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Bell, Gavel, Heart, Receipt, TrendingUp, Trophy } from "lucide-react";
import { Countdown } from "@/components/countdown";
import { StatTile, EmptyState } from "@/components/stat-tile";
import { requireUser } from "@/lib/auth";
import {
  getInvoices,
  getNotifications,
  getUserBidSummary,
  getWatchlist,
} from "@/lib/queries";
import { sweep } from "@/lib/auction";
import { money, relativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

const STANDING_LABEL = {
  leading: ["Leading", "badge-sold"],
  outbid: ["Outbid", "badge-live"],
  won: ["Won", "badge-sold"],
  lost: ["Lost", "badge-ended"],
} as const;

export default async function DashboardPage() {
  sweep();
  const user = await requireUser();
  const bids = getUserBidSummary(user.id);
  const watchlist = getWatchlist(user.id);
  const invoices = getInvoices(user.id);
  const notifications = getNotifications(user.id, 6);

  const active = bids.filter((b) => b.status === "live" || b.status === "scheduled");
  const leading = active.filter((b) => b.leading).length;
  const won = bids.filter((b) => b.standing === "won").length;
  const due = invoices.filter((i) => i.status === "due");
  const dueTotal = due.reduce((sum, i) => sum + i.total, 0);

  return (
    <div className="space-y-10">
      {user.bidder_status === "pending" && (
        <div className="card border-l-[3px] border-l-amber-ac bg-[#fffaf2] p-5">
          <h2 className="text-[18px]">Your registration is under review</h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-500">
            A member of the office is reviewing your details — usually within one business day. You
            can browse the catalogue, watch lots and ask questions in the meantime; bidding opens as
            soon as your paddle is issued.
          </p>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Active bids"
          value={String(active.length)}
          sub={`${leading} currently leading`}
          icon={Gavel}
          tone={leading > 0 ? "gain" : "default"}
        />
        <StatTile label="Watching" value={String(watchlist.length)} icon={Heart} />
        <StatTile label="Lots won" value={String(won)} icon={Trophy} tone="gain" />
        <StatTile
          label="Amount due"
          value={money(dueTotal)}
          sub={due.length ? `${due.length} open invoice${due.length === 1 ? "" : "s"}` : "Nothing outstanding"}
          icon={Receipt}
          tone={dueTotal > 0 ? "warn" : "default"}
        />
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4 border-b border-ink-100 pb-4">
          <h2 className="text-[24px]">Active bids</h2>
          <Link href="/dashboard/bids" className="text-[13px] text-brand-500 hover:underline">
            All bid activity
          </Link>
        </div>

        {active.length === 0 ? (
          <EmptyState
            icon={Gavel}
            title="No active bids"
            body="Lots you bid on will appear here with your standing, updated the moment someone else bids."
            action={{ href: "/lots?status=live", label: "Browse live lots" }}
          />
        ) : (
          <div className="card overflow-hidden">
            <div className="rows">
              {active.slice(0, 6).map((b) => {
                const [label, cls] = STANDING_LABEL[b.standing];
                return (
                  <Link
                    key={b.id}
                    href={`/lots/${b.slug}`}
                    className="flex items-center gap-4 p-4 transition-colors hover:bg-ink-50"
                  >
                    <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-sm img-ph">
                      <Image src={b.image} alt="" fill sizes="80px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] uppercase tracking-[0.1em] text-ink-400">
                        Lot {b.lot_no}
                      </p>
                      <h3 className="truncate text-[16px] leading-snug">{b.title}</h3>
                      <p className="mt-0.5 text-[12px] text-ink-400">
                        Your max {money(b.my_max)} · {b.bid_count} bids
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="num display text-[19px] font-bold tabular-nums">
                        {money(b.current_bid)}
                      </p>
                      <Countdown endsAt={b.ends_at} className="text-[12px]" />
                    </div>
                    <span className={`badge ${cls} shrink-0`}>{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <div className="mb-5 flex items-end justify-between gap-4 border-b border-ink-100 pb-4">
            <h2 className="text-[24px]">Watchlist</h2>
            <Link href="/dashboard/watchlist" className="text-[13px] text-brand-500 hover:underline">
              View all
            </Link>
          </div>

          {watchlist.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="Nothing saved yet"
              body="Tap Watch on any lot to keep an eye on it and get told before it closes."
              action={{ href: "/lots", label: "Browse the catalogue" }}
            />
          ) : (
            <div className="card overflow-hidden">
              <div className="rows">
                {watchlist.slice(0, 5).map((lot) => (
                  <Link
                    key={lot.id}
                    href={`/lots/${lot.slug}`}
                    className="flex items-center gap-3.5 p-3.5 transition-colors hover:bg-ink-50"
                  >
                    <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-sm img-ph">
                      <Image
                        src={lot.images[0] ?? "/cars/hero-wide.jpg"}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[15px] leading-snug">{lot.title}</h3>
                      <p className="num text-[12px] text-ink-400">
                        {money(lot.current_bid || lot.starting_bid)} · {lot.bid_count} bids
                      </p>
                    </div>
                    <Countdown endsAt={lot.ends_at} className="shrink-0 text-[12px]" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        <section>
          <div className="mb-5 flex items-end justify-between gap-4 border-b border-ink-100 pb-4">
            <h2 className="text-[24px]">Recent activity</h2>
            <Link
              href="/dashboard/notifications"
              className="text-[13px] text-brand-500 hover:underline"
            >
              View all
            </Link>
          </div>

          {notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="Nothing yet"
              body="Outbid alerts, closing reminders and results land here."
            />
          ) : (
            <div className="card overflow-hidden">
              <div className="rows">
                {notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.link ?? "/dashboard/notifications"}
                    className="flex gap-3 p-4 transition-colors hover:bg-ink-50"
                  >
                    <span
                      className={`mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full ${
                        n.type === "won"
                          ? "bg-gain-soft text-gain"
                          : n.type === "outbid"
                            ? "bg-brand-50 text-brand-500"
                            : "bg-ink-100 text-ink-500"
                      }`}
                    >
                      {n.type === "won" ? (
                        <Trophy size={13} />
                      ) : n.type === "outbid" ? (
                        <TrendingUp size={13} />
                      ) : (
                        <Bell size={13} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium leading-snug">{n.title}</p>
                      {n.body && (
                        <p className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed text-ink-400">
                          {n.body}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-ink-300">{relativeTime(n.created_at)}</p>
                    </div>
                    {!n.read_at && (
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
