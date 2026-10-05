import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";

const COLUMNS: Array<[string, Array<[string, string]>]> = [
  [
    "Buy",
    [
      ["/auctions", "Current Auctions"],
      ["/lots?status=live", "Lots Open Now"],
      ["/lots?noReserve=1", "No Reserve Lots"],
      ["/results", "Past Results"],
      ["/how-it-works#bidding", "Bidder Registration"],
    ],
  ],
  [
    "Sell",
    [
      ["/sell", "Consign a Vehicle"],
      ["/how-it-works#fees", "Seller Fees"],
      ["/how-it-works#inspection", "Inspection & Photography"],
      ["/how-it-works#transport", "Transport & Storage"],
    ],
  ],
  [
    "Company",
    [
      ["/event", "Hamptons Weekend"],
      ["/how-it-works", "How It Works"],
      ["/how-it-works#faq", "FAQ"],
      ["/contact", "Contact"],
    ],
  ],
];

export function SiteFooter() {
  return (
    <footer className="border-t border-ink-800 bg-ink-900 text-ink-200">
      <div className="wrap grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Link href="/" className="inline-flex items-center" aria-label="No Reserve Classics home">
            <Image
              src="/brand/nrc-logo-white.png"
              alt="No Reserve Classics"
              width={300}
              height={38}
              className="h-[30px] w-auto"
            />
          </Link>
          <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-ink-300">
            Curated collector car auctions with published condition reports, proxy bidding and
            two-minute soft close on every lot. Bid online, by telephone, or from the floor.
          </p>
          <ul className="mt-6 space-y-2.5 text-[13px]">
            <li className="flex items-center gap-2.5">
              <Phone size={14} className="shrink-0 text-brand-500" />
              <a href="tel:+18005627815" className="hover:text-white">
                (800) 562-7815
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail size={14} className="shrink-0 text-brand-500" />
              <a href="mailto:info@noreserveclassics.com" className="hover:text-white">
                info@noreserveclassics.com
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin size={14} className="mt-1 shrink-0 text-brand-500" />
              <span>
                42 N Main St
                <br />
                Marlboro, NJ 07746
              </span>
            </li>
          </ul>
        </div>

        {COLUMNS.map(([heading, links]) => (
          <div key={heading}>
            <h3 className="display text-[12px] font-bold uppercase tracking-[0.16em] text-white">
              {heading}
            </h3>
            <ul className="mt-4 space-y-2.5 text-[14px]">
              {links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-ink-300 transition-colors hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="wrap flex flex-col gap-3 py-5 text-[12px] text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} No Reserve Classics LLC. All rights reserved.</p>
          <div className="flex flex-wrap gap-5">
            <Link href="/terms" className="hover:text-white">
              Terms &amp; Conditions
            </Link>
            <Link href="/privacy" className="hover:text-white">
              Privacy Policy
            </Link>
            <span>NJ Dealer Lic. #D-1427A</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
