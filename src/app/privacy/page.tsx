import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacy Policy" };

const SECTIONS: Array<[string, string[]]> = [
  [
    "What we collect",
    [
      "When you register we collect your name, email address, telephone number and, optionally, your company or brokerage. We record the bids you place, the lots you watch and the questions you ask on lot pages.",
      "For buyers, we collect the information needed to issue an invoice and transfer title. For consignors, we collect the vehicle details you submit and the documentation you provide.",
      "We do not store payment card details. Settlement is by wire transfer, handled by our bank.",
    ],
  ],
  [
    "How we use it",
    [
      "To operate the auction: verifying registrations, running bidding, sending outbid and closing notifications, issuing invoices and arranging transport.",
      "To tell you about sales that are relevant to you. You can stop these at any time without affecting your ability to bid.",
      "To meet our legal obligations, including anti-money-laundering checks and tax reporting.",
    ],
  ],
  [
    "What other people see",
    [
      "Bid history is public on each lot page, showing bidders by first name and last initial. Your maximum bid is never shown to anyone, including the seller.",
      "Comments and questions you post on a lot page are public and remain attached to that lot permanently.",
      "Your email address, telephone number and address are never published.",
    ],
  ],
  [
    "Who we share it with",
    [
      "With the consignor of a lot you have won, to the extent needed to complete the sale and transfer title.",
      "With transport and storage providers you ask us to engage on your behalf.",
      "With our bank, auditors and legal advisers, and with authorities where we are legally required to disclose.",
      "We do not sell personal information, and we do not share it with advertisers.",
    ],
  ],
  [
    "How long we keep it",
    [
      "Account and bidding records are retained for seven years after your last activity, which is the period our regulatory and tax obligations require.",
      "Sale records — lots, hammer prices and buyer identities — are retained indefinitely as part of the provenance record for each vehicle.",
    ],
  ],
  [
    "Your choices",
    [
      "You can see and correct the information on your account at any time from your dashboard.",
      "You can ask us for a copy of what we hold, or ask us to delete it, by writing to info@noreserveclassics.com. Where we are required to retain records we will tell you which and why.",
      "Marketing emails carry an unsubscribe link in every message.",
    ],
  ],
  [
    "Contact",
    [
      "Questions about this policy should go to info@noreserveclassics.com, or No Reserve Classics LLC, 42 N Main St, Marlboro, NJ 07746.",
    ],
  ],
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Your Information"
      title="Privacy Policy"
      updated="Last updated 1 September 2026"
      intro="What we collect when you register and bid, what we do with it, and what other bidders can see."
      sections={SECTIONS}
    />
  );
}
