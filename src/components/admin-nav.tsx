"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNav({
  pendingBidders,
  newConsignments,
}: {
  pendingBidders: number;
  newConsignments: number;
}) {
  const pathname = usePathname();

  const tabs: Array<[href: string, label: string, badge?: number]> = [
    ["/admin", "Overview"],
    ["/admin/lots", "Lots"],
    ["/admin/bidders", "Bidders", pendingBidders],
    ["/admin/consignments", "Consignments", newConsignments],
    ["/admin/rsvps", "Event RSVPs"],
    ["/admin/invoices", "Invoices"],
  ];

  return (
    <nav className="thin-scroll sticky top-16 z-30 overflow-x-auto border-b border-ink-100 bg-white">
      <div className="wrap flex gap-1">
        {tabs.map(([href, label, badge]) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`display whitespace-nowrap border-b-2 px-3.5 py-3.5 text-[13px] font-bold uppercase tracking-[0.07em] transition-colors ${
                active
                  ? "border-brand-500 text-brand-500"
                  : "border-transparent text-ink-400 hover:text-ink-900"
              }`}
            >
              {label}
              {badge != null && badge > 0 && (
                <span className="num ml-1.5 inline-grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand-500 px-1 text-[10px] text-white">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
