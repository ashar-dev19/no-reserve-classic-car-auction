import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { CalendarDays, Clock, MapPin, Users, Wine, Gavel } from "lucide-react";
import { RsvpForm } from "@/components/rsvp-form";
import { LotCard } from "@/components/lot-card";
import { toCardData } from "@/lib/lot-card-data";
import { Countdown } from "@/components/countdown";
import { auctionLotStats, getAuctionBySlug } from "@/lib/queries";
import { listLots, sweep } from "@/lib/auction";
import { compactMoney, dateOnly } from "@/lib/format";

export const metadata: Metadata = {
  title: "The Hamptons Collector Sale — Columbus Day Weekend",
  description:
    "Three days on the East End. 1,200 invited brokers and collectors. Preview Friday, bidding closes through Monday evening.",
};

const SCHEDULE: Array<[string, string, string, typeof CalendarDays]> = [
  [
    "Friday",
    "Preview Day",
    "9:00 AM – 6:00 PM · Catalogue viewing, specialists on hand, condition reports available in print.",
    CalendarDays,
  ],
  [
    "Saturday",
    "Collectors' Reception",
    "6:00 PM – 10:00 PM · Cocktails and dinner on the lawn. Paddle registration closes at 8:00 PM.",
    Wine,
  ],
  [
    "Sunday",
    "Floor Bidding Opens",
    "11:00 AM · Live floor and telephone bidding runs alongside the online clock.",
    Gavel,
  ],
  [
    "Monday",
    "Lots Close",
    "From 4:00 PM · Lots close in catalogue order with two-minute soft-close extensions.",
    Clock,
  ],
];

export default function EventPage() {
  sweep();
  const auction = getAuctionBySlug("hamptons-collector-sale");
  const stats = auction ? auctionLotStats(auction.id) : null;
  const lots = listLots({
    auctionSlug: "hamptons-collector-sale",
    status: "open",
    sort: "price_desc",
    limit: 4,
  });

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-ink-900 text-white">
        <Image
          src="/cars/field-classics.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/95 via-ink-950/80 to-ink-950/50" />

        <div className="wrap relative grid gap-12 py-16 lg:grid-cols-[1.1fr_440px] lg:items-start lg:py-20">
          <div>
            <p className="eyebrow">Columbus Day Weekend · By Invitation</p>
            <h1 className="mt-3 text-[42px] leading-[1.05] sm:text-[56px]">
              The Hamptons
              <br />
              Collector Sale
            </h1>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-ink-200">
              Three days on the East End, 1,200 invited brokers and collectors, and a catalogue
              assembled for this room specifically. Preview Friday, reception Saturday, and lots
              closing through Monday evening.
            </p>

            <div className="mt-7 flex flex-wrap gap-x-7 gap-y-3 text-[14px] text-ink-300">
              <span className="flex items-center gap-2">
                <MapPin size={16} className="text-brand-500" />
                Bridgehampton Historical Society, NY
              </span>
              {auction && (
                <span className="flex items-center gap-2">
                  <CalendarDays size={16} className="text-brand-500" />
                  {dateOnly(auction.starts_at)} – {dateOnly(auction.ends_at)}
                </span>
              )}
              <span className="flex items-center gap-2">
                <Users size={16} className="text-brand-500" />
                1,200 invited guests
              </span>
            </div>

            {auction && (
              <dl className="mt-10 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-6 border-t border-white/15 pt-8 sm:grid-cols-4">
                {[
                  ["Lots catalogued", String(stats?.total ?? 0)],
                  ["Open now", String(stats?.open ?? 0)],
                  ["Low estimate total", compactMoney(lowEstimateTotal())],
                  ["Buyer's premium", `${auction.buyers_premium_bps / 100}%`],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[11px] uppercase tracking-[0.12em] text-ink-300">
                      {label}
                    </dt>
                    <dd className="num display mt-1 text-[24px] font-bold leading-none">{value}</dd>
                  </div>
                ))}
                <div className="col-span-2 sm:col-span-4">
                  <dt className="text-[11px] uppercase tracking-[0.12em] text-ink-300">
                    {auction.status === "live" ? "Sale closes in" : "Preview opens in"}
                  </dt>
                  <dd>
                    <Countdown
                      endsAt={auction.status === "live" ? auction.ends_at : auction.starts_at}
                      className="display mt-1 text-[30px] font-bold leading-none !text-white"
                    />
                  </dd>
                </div>
              </dl>
            )}
          </div>

          <RsvpForm />
        </div>
      </section>

      {/* Schedule */}
      <section className="wrap py-16">
        <div className="border-b border-ink-100 pb-5">
          <p className="eyebrow">Programme</p>
          <h2 className="mt-2 text-[32px] leading-tight">Four days, lot by lot</h2>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SCHEDULE.map(([day, title, body, Icon]) => (
            <div key={day} className="card p-6">
              <Icon size={20} className="text-brand-500" strokeWidth={1.8} />
              <p className="eyebrow mt-4">{day}</p>
              <h3 className="mt-1.5 text-[19px] leading-snug">{title}</h3>
              <p className="mt-2.5 text-[13px] leading-relaxed text-ink-400">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why brokers */}
      <section className="border-y border-ink-100 bg-ink-50">
        <div className="wrap grid gap-12 py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow">Why This Room</p>
            <h2 className="mt-2 text-[32px] leading-tight">
              The East End audience, in one weekend
            </h2>
            <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-ink-600">
              <p>
                The brokers who sell the houses on this stretch of coastline are the same people
                who fill the garages behind them. Putting a catalogue in front of 1,200 of them over
                a single long weekend concentrates a year of private-sale conversations into three
                days.
              </p>
              <p>
                Every registered guest gets a paddle, a printed catalogue and access to the
                specialists who inspected each car. Bidding runs online, by telephone and from the
                floor simultaneously, so nobody has to be in the room to buy — but most want to be.
              </p>
            </div>

            <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-ink-100 pt-7 sm:grid-cols-3">
              {[
                ["Invited guests", "1,200"],
                ["Average dwell time", "4.2 hrs"],
                ["Repeat bidders", "68%"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[11px] uppercase tracking-[0.1em] text-ink-400">{label}</dt>
                  <dd className="num display mt-1 text-[26px] font-bold leading-none">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-md img-ph">
            <Image
              src="/cars/lineup.jpg"
              alt="Cars lined up at a previous No Reserve Classics sale"
              fill
              sizes="(max-width: 1024px) 100vw, 600px"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Headline lots */}
      {lots.length > 0 && (
        <section className="wrap py-16">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink-100 pb-5">
            <div>
              <p className="eyebrow">From the Catalogue</p>
              <h2 className="mt-2 text-[32px] leading-tight">Headline lots</h2>
            </div>
            <Link href="/auctions/hamptons-collector-sale" className="btn btn-outline">
              View all {stats?.total ?? 0} lots
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {lots.map((lot) => (
              <LotCard key={lot.id} lot={toCardData(lot)} />
            ))}
          </div>
        </section>
      )}

      {/* Logistics */}
      <section className="bg-ink-900 text-white">
        <div className="wrap grid gap-10 py-16 md:grid-cols-3">
          {[
            [
              "Getting there",
              "Bridgehampton Historical Society, 2368 Montauk Highway. Valet parking on site Friday through Monday. Jitney and rail connections to Bridgehampton station, ten minutes away.",
            ],
            [
              "Bidding from elsewhere",
              "Telephone bidding is arranged in advance with a specialist, and the online clock runs the full weekend. Register once and bid any way you like.",
            ],
            [
              "After the hammer",
              "Settlement within five business days. Enclosed transport, indoor storage and title transfer are arranged in-house for any lot, anywhere in the lower 48.",
            ],
          ].map(([title, body]) => (
            <div key={title}>
              <h3 className="text-[19px]">{title}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-ink-300">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function lowEstimateTotal(): number {
  const lots = listLots({
    auctionSlug: "hamptons-collector-sale",
    status: "all",
    limit: 500,
  });
  return lots.reduce((sum, l) => sum + (l.estimate_low ?? 0), 0);
}
