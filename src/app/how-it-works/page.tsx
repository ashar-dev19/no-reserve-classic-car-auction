import Link from "next/link";
import type { Metadata } from "next";
import { Gavel, Timer, ShieldCheck, Receipt, Truck, FileSearch } from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Proxy bidding, soft close, reserves, buyer's premium and settlement — explained plainly.",
};

const SECTIONS = [
  {
    id: "bidding",
    icon: Gavel,
    title: "Bidding",
    body: [
      "Register once and your paddle carries across every sale. Registrations are reviewed by a person, usually within one business day, and you are notified the moment yours clears.",
      "When you bid, you name a maximum — the most you are willing to pay. We bid on your behalf one increment at a time, only as high as needed to keep you in front. Your ceiling is never shown to other bidders, and raising it later never moves the price on its own.",
      "If someone else's standing maximum is above yours, the price rises to one increment over your number and you are outbid immediately. That is the system working correctly: you were never going to win at that price.",
    ],
    table: [
      ["Under $1,000", "$25"],
      ["$1,000 – $5,000", "$100"],
      ["$5,000 – $25,000", "$250"],
      ["$25,000 – $50,000", "$500"],
      ["$50,000 – $100,000", "$1,000"],
      ["$100,000 – $250,000", "$2,500"],
      ["$250,000 – $500,000", "$5,000"],
      ["Above $500,000", "$10,000"],
    ],
  },
  {
    id: "soft-close",
    icon: Timer,
    title: "Soft close",
    body: [
      "Every lot closes on a two-minute soft close. Any bid placed inside the final two minutes pushes the clock back out to two minutes.",
      "This is the single most important rule we run. It means a lot cannot be won by arriving in the last second, and it means you never have to sit on the page at 4:59 PM to protect a position. Bidding ends when bidding actually stops.",
    ],
  },
  {
    id: "reserves",
    icon: ShieldCheck,
    title: "Reserves and no-reserve lots",
    body: [
      "A reserve is the lowest price a seller will accept. We never publish the figure, but we always show whether it has been met — so you know whether the car is going to sell at the current number.",
      "No-reserve lots sell to the high bidder, full stop. There is no safety net for the seller and no secret floor for the buyer. Roughly a third of our catalogue runs at no reserve.",
    ],
  },
  {
    id: "inspection",
    icon: FileSearch,
    title: "Inspection and condition reports",
    body: [
      "Every lot is inspected by our team and photographed in natural light. The condition report is published in full on the lot page, and it includes a 'known flaws' section that we do not soften.",
      "Lots are sold as-is. Viewing before the sale is encouraged and can be arranged at any time. If a question is not answered in the report, ask it in the comments — a specialist answers publicly so every bidder sees the same information.",
    ],
  },
  {
    id: "fees",
    icon: Receipt,
    title: "Fees",
    body: [
      "Buyers pay a premium on top of the hammer price: 10% at live sales, 8% on online-only sales. The premium is shown on every lot page and included in the running total beside the bid box.",
      "Sellers pay a flat 5% commission on the hammer price, capped at $7,500. There is no listing fee, and nothing is owed if the lot does not sell.",
    ],
    table: [
      ["Buyer's premium — live sales", "10%"],
      ["Buyer's premium — online only", "8%"],
      ["Seller's commission", "5%, capped at $7,500"],
      ["Listing fee", "None"],
      ["Unsold lot fee", "None"],
    ],
  },
  {
    id: "transport",
    icon: Truck,
    title: "Settlement, transport and storage",
    body: [
      "Invoices are issued the moment a lot closes and are payable within five business days by wire. Title transfer is handled by our office.",
      "We arrange enclosed transport anywhere in the lower 48, and climate-controlled indoor storage at our Bridgehampton facility for up to 60 days at no charge while you make arrangements.",
    ],
  },
];

const FAQ: Array<[string, string]> = [
  [
    "Do I need to be approved before I can bid?",
    "Yes. Registration is free and reviewed by a person, usually within one business day. You can browse, watch lots and ask questions while your registration is pending.",
  ],
  [
    "Can I retract a bid?",
    "Bids are binding. If you have made a genuine error — a misplaced digit, most often — call the office immediately on (800) 562-7815 and we will deal with it before the lot closes. After the hammer, no.",
  ],
  [
    "What happens if the reserve is not met?",
    "The lot does not sell. We put the high bidder and the seller in touch afterwards, and a meaningful share of those conversations close within a week at a number both sides accept.",
  ],
  [
    "Can I bid by telephone?",
    "At live sales, yes. Arrange it with a specialist at least 24 hours before the lot is due to close and we will call you when it comes up.",
  ],
  [
    "How do I know the mileage and history are real?",
    "We verify VIN, title status and odometer against available records, and we say so in the report when something cannot be verified. Where a car has a documented history file, it is photographed and published with the lot.",
  ],
  [
    "Do you ship internationally?",
    "We arrange export documentation and port delivery; the freight booking itself is the buyer's. Our office will walk you through it.",
  ],
];

export default function HowItWorksPage() {
  return (
    <>
      <header className="border-b border-ink-100 bg-ink-50">
        <div className="wrap py-10">
          <p className="eyebrow">Plainly Stated</p>
          <h1 className="mt-2 text-[36px] leading-tight sm:text-[44px]">How it works</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-500">
            Auctions run on rules. Here are ours, in full — what you pay, how bidding actually
            resolves, and what happens after the hammer.
          </p>
        </div>
      </header>

      <div className="wrap grid gap-12 py-12 lg:grid-cols-[220px_1fr]">
        {/* Side nav */}
        <nav aria-label="On this page" className="lg:sticky lg:top-[88px] lg:self-start">
          <p className="label">On this page</p>
          <ul className="space-y-1">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="block py-1.5 text-[14px] text-ink-500 transition-colors hover:text-brand-500"
                >
                  {s.title}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#faq"
                className="block py-1.5 text-[14px] text-ink-500 transition-colors hover:text-brand-500"
              >
                FAQ
              </a>
            </li>
          </ul>
        </nav>

        <div className="min-w-0 max-w-3xl">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <section key={section.id} id={section.id} className="mb-14 scroll-mt-28">
                <div className="flex items-center gap-3">
                  <Icon size={22} className="text-brand-500" strokeWidth={1.8} />
                  <h2 className="text-[28px] leading-tight">{section.title}</h2>
                </div>

                <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-ink-600">
                  {section.body.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>

                {section.table && (
                  <dl className="mt-6 card overflow-hidden">
                    <div className="rows">
                      {section.table.map(([term, value]) => (
                        <div key={term} className="flex justify-between gap-4 px-4 py-3">
                          <dt className="text-[14px] text-ink-500">{term}</dt>
                          <dd className="num text-[14px] font-medium tabular-nums">{value}</dd>
                        </div>
                      ))}
                    </div>
                  </dl>
                )}
              </section>
            );
          })}

          <section id="faq" className="scroll-mt-28">
            <h2 className="text-[28px] leading-tight">Frequently asked</h2>
            <div className="mt-5 space-y-3">
              {FAQ.map(([q, a]) => (
                <details key={q} className="card group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 text-[16px] font-medium">
                    {q}
                    <span className="shrink-0 text-ink-300 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-[14px] leading-relaxed text-ink-500">{a}</p>
                </details>
              ))}
            </div>
          </section>

          <div className="mt-12 flex flex-wrap gap-3 border-t border-ink-100 pt-8">
            <Link href="/register" className="btn btn-primary">
              Register to Bid
            </Link>
            <Link href="/contact" className="btn btn-outline">
              Talk to a Specialist
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
