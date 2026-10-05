import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms & Conditions" };

const SECTIONS: Array<[string, string[]]> = [
  [
    "1. Registration and bidding",
    [
      "Bidding requires an approved account. We review every registration and may decline or revoke one at our discretion, including where identity or funds cannot be verified.",
      "Every bid is a binding offer to purchase at that price plus the buyer's premium and applicable taxes. Bids may not be retracted after a lot closes. Where a bid is placed in genuine error, contact the office before the lot closes and we will consider cancelling it.",
      "We may impose a maximum bid limit on any account. Bids above an account's limit are rejected at the point of placement.",
    ],
  ],
  [
    "2. Proxy bidding and soft close",
    [
      "When you place a bid you set a maximum. We bid on your behalf in the published increments only as far as necessary to maintain the leading position, up to your maximum. Your maximum is confidential and is not disclosed to other bidders or to the seller.",
      "Where two bidders hold maximums above the current price, the price advances to one increment above the lower maximum, and the bidder holding the higher maximum leads.",
      "Every lot closes on a two-minute soft close. A bid placed within two minutes of the scheduled close extends that lot's closing time to two minutes from the time of the bid. There is no limit on the number of extensions.",
    ],
  ],
  [
    "3. Reserves",
    [
      "A lot offered with a reserve will not be sold below it. We publish whether a reserve has been met but never the figure itself.",
      "A lot offered at no reserve will be sold to the highest bidder at the close, at whatever price that is.",
      "Where a reserve is not met, we may introduce the high bidder and the consignor to one another after the sale. Any resulting sale remains subject to our commission.",
    ],
  ],
  [
    "4. Fees",
    [
      "Buyers pay a premium on the hammer price: 10% at live sales and 8% at online-only sales, as stated on each lot page.",
      "Sellers pay a commission of 5% of the hammer price, capped at $7,500. There is no listing fee and no fee where a lot does not sell.",
      "The buyer is responsible for all applicable sales, use and transfer taxes, and for registration in their jurisdiction.",
    ],
  ],
  [
    "5. Condition and description",
    [
      "All lots are sold as-is, where-is. Descriptions, condition reports and photographs are prepared in good faith and represent our opinion; they are not warranties.",
      "We publish known faults identified by our inspector. No inspection is exhaustive, and the absence of a fault from a report is not a representation that the fault does not exist.",
      "Bidders are strongly encouraged to inspect a lot in person or appoint an agent to do so before bidding. Viewing can be arranged at any time before the close.",
    ],
  ],
  [
    "6. Payment and collection",
    [
      "Invoices are issued on the fall of the hammer and are payable in full within five business days by wire transfer.",
      "Title passes on receipt of cleared funds. Risk passes on collection or on delivery to a carrier nominated by the buyer.",
      "Storage is provided free of charge for 60 days from the sale. Thereafter storage is charged at $25 per day.",
      "Where payment is not received within fifteen business days we may cancel the sale, re-offer the lot and pursue the defaulting buyer for any shortfall and costs.",
    ],
  ],
  [
    "7. Limitation of liability",
    [
      "Our liability to any bidder or consignor in respect of any lot is limited to the amount of the buyer's premium or seller's commission actually received by us in respect of that lot.",
      "We are not liable for any failure of a bidder's internet connection, device or power supply, nor for any interruption to the platform however caused. Bidders who are concerned about connectivity should arrange telephone bidding in advance.",
    ],
  ],
  [
    "8. Governing law",
    [
      "These terms are governed by the laws of the State of New York. Any dispute is subject to the exclusive jurisdiction of the courts of Suffolk County, New York.",
    ],
  ],
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="The Rules of Sale"
      title="Terms & Conditions"
      updated="Last updated 1 September 2026"
      intro="These terms govern every sale we conduct and every bid placed through this platform. Registering an account constitutes acceptance of them."
      sections={SECTIONS}
    />
  );
}
