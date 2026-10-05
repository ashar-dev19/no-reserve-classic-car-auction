"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS: Array<[href: string, label: string]> = [
  ["/dashboard", "Overview"],
  ["/dashboard/bids", "My Bids"],
  ["/dashboard/watchlist", "Watchlist"],
  ["/dashboard/invoices", "Invoices"],
  ["/dashboard/notifications", "Notifications"],
];

export function DashboardNav({ unread }: { unread: number }) {
  const pathname = usePathname();

  return (
    <nav className="thin-scroll sticky top-16 z-30 overflow-x-auto border-b border-ink-100 bg-white">
      <div className="wrap flex gap-1">
        {TABS.map(([href, label]) => {
          const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`display relative whitespace-nowrap border-b-2 px-3.5 py-3.5 text-[13px] font-bold uppercase tracking-[0.07em] transition-colors ${
                active
                  ? "border-brand-500 text-brand-500"
                  : "border-transparent text-ink-400 hover:text-ink-900"
              }`}
            >
              {label}
              {href === "/dashboard/notifications" && unread > 0 && (
                <span className="num ml-1.5 inline-grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand-500 px-1 text-[10px] text-white">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
