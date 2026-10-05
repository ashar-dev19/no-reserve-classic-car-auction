import type { Metadata } from "next";
import { Roboto, Roboto_Condensed } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getCurrentUser } from "@/lib/auth";
import { sweep } from "@/lib/auction";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

const condensed = Roboto_Condensed({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-roboto-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "No Reserve Classics — Collector Car Auctions",
    template: "%s · No Reserve Classics",
  },
  description:
    "Curated collector car auctions with transparent condition reports, proxy bidding and soft-close. Bid online, by telephone or from the floor.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Keeps the clock honest on every navigation: opens lots that are due and
  // settles any whose time ran out while nobody was looking.
  sweep();
  const user = await getCurrentUser();

  return (
    <html lang="en" className={`${roboto.variable} ${condensed.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-ink-900 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <SiteHeader user={user} />
        <main id="main" className="min-h-[60vh]">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
