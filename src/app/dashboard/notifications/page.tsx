import Link from "next/link";
import type { Metadata } from "next";
import { Bell, CheckCheck, Gavel, TrendingUp, Trophy } from "lucide-react";
import { EmptyState } from "@/components/stat-tile";
import { requireUser } from "@/lib/auth";
import { getNotifications, unreadCount } from "@/lib/queries";
import { markNotificationsReadAction } from "@/app/actions/bidding";
import { relativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "Notifications" };

const ICONS = {
  won: Trophy,
  outbid: TrendingUp,
  lot_closed: Gavel,
} as const;

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = getNotifications(user.id, 100);
  const unread = unreadCount(user.id);

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="No notifications yet"
        body="Outbid alerts, closing reminders and sale results land here as they happen."
        action={{ href: "/lots?status=live", label: "Browse live lots" }}
      />
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-ink-100 pb-4">
        <h2 className="text-[24px]">
          Notifications
          {unread > 0 && <span className="ml-2 text-[15px] text-brand-500">{unread} unread</span>}
        </h2>
        {unread > 0 && (
          <form action={markNotificationsReadAction}>
            <button type="submit" className="btn btn-outline btn-sm">
              <CheckCheck size={15} /> Mark all read
            </button>
          </form>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="rows">
          {notifications.map((n) => {
            const Icon = ICONS[n.type as keyof typeof ICONS] ?? Bell;
            return (
              <Link
                key={n.id}
                href={n.link ?? "#"}
                className={`flex gap-3.5 p-4 transition-colors hover:bg-ink-50 ${
                  n.read_at ? "" : "bg-[#fffcfc]"
                }`}
              >
                <span
                  className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                    n.type === "won"
                      ? "bg-gain-soft text-gain"
                      : n.type === "outbid"
                        ? "bg-brand-50 text-brand-500"
                        : "bg-ink-100 text-ink-500"
                  }`}
                >
                  <Icon size={15} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium leading-snug">{n.title}</p>
                  {n.body && (
                    <p className="mt-1 text-[14px] leading-relaxed text-ink-500">{n.body}</p>
                  )}
                  <p className="mt-1.5 text-[12px] text-ink-300">{relativeTime(n.created_at)}</p>
                </div>

                {!n.read_at && (
                  <span
                    className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-500"
                    aria-label="Unread"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
