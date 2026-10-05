"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, User2, Bell, ChevronDown } from "lucide-react";
import type { PublicUser } from "@/lib/types";
import { logoutAction } from "@/app/actions/auth";

const NAV = [
  { href: "/auctions", label: "Auctions" },
  { href: "/lots", label: "Browse Lots" },
  { href: "/event", label: "Hamptons Weekend" },
  { href: "/sell", label: "Sell / Consign" },
  { href: "/how-it-works", label: "How It Works" },
];

export function SiteHeader({ user }: { user: PublicUser | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    setOpen(false);
    setMenu(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-ink-800 bg-ink-900 text-white">
      {/* Utility strip */}
      <div className="hidden border-b border-white/10 md:block">
        <div className="wrap flex h-9 items-center justify-between text-[12px] text-ink-300">
          <p className="tracking-wide">
            Columbus Day Weekend · The Hamptons Collector Sale ·{" "}
            <Link href="/event" className="text-white underline-offset-2 hover:underline">
              Reserve your paddle
            </Link>
          </p>
          <div className="flex items-center gap-5">
            <a href="tel:+18005627815" className="hover:text-white">
              (800) 562-7815
            </a>
            <Link href="/how-it-works#bidding" className="hover:text-white">
              Bidder Registration
            </Link>
          </div>
        </div>
      </div>

      <div className="wrap flex h-16 items-center justify-between gap-3 lg:gap-6">
        <Link href="/" className="flex shrink-0 items-center" aria-label="No Reserve Classics home">
          <Image
            src="/brand/nrc-logo-white.png"
            alt="No Reserve Classics"
            width={300}
            height={38}
            priority
            className="h-[22px] w-auto sm:h-[26px] lg:h-[30px]"
          />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`display px-3 py-2 text-[13px] font-bold uppercase tracking-[0.08em] transition-colors ${
                  active ? "text-brand-500" : "text-ink-200 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/dashboard/notifications"
                className="relative hidden h-9 w-9 place-items-center rounded-sm text-ink-200 transition-colors hover:bg-white/10 hover:text-white sm:grid"
                aria-label="Notifications"
              >
                <Bell size={18} />
              </Link>
              <div className="relative">
                <button
                  onClick={() => setMenu((v) => !v)}
                  className="flex h-9 items-center gap-2 rounded-sm px-2 text-ink-100 transition-colors hover:bg-white/10"
                  aria-expanded={menu}
                  aria-haspopup="menu"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15 text-[11px] font-bold">
                    {user.name.slice(0, 1)}
                  </span>
                  <span className="hidden text-[13px] sm:inline">{user.name.split(" ")[0]}</span>
                  <ChevronDown size={14} className="hidden sm:inline" />
                </button>
                {menu && (
                  <div
                    role="menu"
                    className="absolute right-0 top-11 w-60 overflow-hidden rounded-sm border border-ink-100 bg-white py-1 text-ink-900 shadow-[0_12px_40px_-12px_rgba(0,0,0,.45)]"
                  >
                    <div className="border-b border-ink-100 px-4 py-3">
                      <p className="truncate text-[13px] font-medium">{user.name}</p>
                      <p className="truncate text-[12px] text-ink-400">{user.email}</p>
                      <p className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                        <span
                          className={`badge ${
                            user.bidder_status === "approved"
                              ? "badge-sold"
                              : user.bidder_status === "suspended"
                                ? "badge-live"
                                : "badge-ended"
                          }`}
                        >
                          {user.bidder_status === "approved"
                            ? `Paddle ${user.paddle_no}`
                            : user.bidder_status}
                        </span>
                      </p>
                    </div>
                    {[
                      ["/dashboard", "Dashboard"],
                      ["/dashboard/bids", "My Bids"],
                      ["/dashboard/watchlist", "Watchlist"],
                      ["/dashboard/invoices", "Invoices"],
                      ...(user.role === "admin" ? [["/admin", "Admin Console"] as const] : []),
                    ].map(([href, label]) => (
                      <Link
                        key={href}
                        href={href}
                        role="menuitem"
                        className="block px-4 py-2 text-[13px] hover:bg-ink-50"
                      >
                        {label}
                      </Link>
                    ))}
                    <form action={logoutAction} className="border-t border-ink-100">
                      <button
                        type="submit"
                        className="w-full px-4 py-2 text-left text-[13px] text-brand-600 hover:bg-ink-50"
                      >
                        Sign out
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost-light btn-sm hidden sm:inline-flex">
                <User2 size={15} /> Sign In
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                Register<span className="hidden sm:inline">&nbsp;to Bid</span>
              </Link>
            </>
          )}

          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-sm text-white transition-colors hover:bg-white/10 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-white/10 bg-ink-900 lg:hidden">
          <div className="wrap flex flex-col py-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="display border-b border-white/5 py-3.5 text-[14px] font-bold uppercase tracking-[0.08em] text-ink-100"
              >
                {item.label}
              </Link>
            ))}
            {!user && (
              <Link href="/login" className="display py-3.5 text-[14px] font-bold uppercase tracking-[0.08em] text-ink-100">
                Sign In
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
