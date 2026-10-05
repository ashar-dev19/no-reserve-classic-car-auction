import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach the No Reserve Classics office in Bridgehampton, New York.",
};

const SPECIALISTS: Array<[string, string, string]> = [
  ["Dana Whitlock", "Head of Sale", "dana@noreserveclassics.com"],
  ["Marco Santoro", "Classic & Pre-War", "marco@noreserveclassics.com"],
  ["Priya Raman", "Modern & Supercars", "priya@noreserveclassics.com"],
  ["Tom Belcher", "Consignments", "tom@noreserveclassics.com"],
];

export default function ContactPage() {
  return (
    <>
      <header className="border-b border-ink-100 bg-ink-50">
        <div className="wrap py-10">
          <p className="eyebrow">Get in Touch</p>
          <h1 className="mt-2 text-[36px] leading-tight sm:text-[44px]">Contact</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-500">
            Questions about a lot, a consignment or a registration are best answered by a person.
            Call the office and you will get one.
          </p>
        </div>
      </header>

      <div className="wrap grid gap-12 py-14 lg:grid-cols-2">
        <div>
          <h2 className="text-[24px]">The office</h2>
          <dl className="mt-5 space-y-5">
            {[
              [Phone, "Telephone", "(800) 562-7815", "tel:+18005627815"],
              [Mail, "Email", "info@noreserveclassics.com", "mailto:info@noreserveclassics.com"],
            ].map(([Icon, label, value, href]) => {
              const I = Icon as typeof Phone;
              return (
                <div key={label as string} className="flex gap-3.5">
                  <I size={18} className="mt-0.5 shrink-0 text-brand-500" strokeWidth={1.8} />
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.1em] text-ink-400">
                      {label as string}
                    </dt>
                    <dd className="mt-0.5 text-[16px]">
                      <a href={href as string} className="hover:text-brand-500">
                        {value as string}
                      </a>
                    </dd>
                  </div>
                </div>
              );
            })}

            <div className="flex gap-3.5">
              <MapPin size={18} className="mt-0.5 shrink-0 text-brand-500" strokeWidth={1.8} />
              <div>
                <dt className="text-[11px] uppercase tracking-[0.1em] text-ink-400">Address</dt>
                <dd className="mt-0.5 text-[16px] leading-relaxed">
                  Gallery &amp; Showroom
                  <br />
                  42 N Main St
                  <br />
                  Marlboro, NJ 07746
                </dd>
              </div>
            </div>

            <div className="flex gap-3.5">
              <Clock size={18} className="mt-0.5 shrink-0 text-brand-500" strokeWidth={1.8} />
              <div>
                <dt className="text-[11px] uppercase tracking-[0.1em] text-ink-400">Hours</dt>
                <dd className="mt-0.5 space-y-0.5 text-[15px]">
                  <p>Monday – Friday · 9:00 AM – 6:00 PM</p>
                  <p>Saturday · 10:00 AM – 2:00 PM</p>
                  <p className="text-ink-400">Sunday · Closed</p>
                </dd>
              </div>
            </div>
          </dl>

          <div className="mt-6 flex gap-3.5">
            <MapPin size={18} className="mt-0.5 shrink-0 text-brand-500" strokeWidth={1.8} />
            <div>
              <p className="text-[11px] uppercase tracking-[0.1em] text-ink-400">Service centre</p>
              <p className="mt-0.5 text-[16px] leading-relaxed">
                1 Route 22
                <br />
                Green Brook, NJ 08812
              </p>
            </div>
          </div>

          <p className="mt-8 rounded-full border border-ink-100 bg-ink-50 px-5 py-3.5 text-[13px] leading-relaxed text-ink-500">
            During a live sale weekend the office runs extended hours and the phones are answered
            until the final lot closes.
          </p>
        </div>

        <div>
          <h2 className="text-[24px]">Specialists</h2>
          <div className="card mt-5 overflow-hidden">
            <div className="rows">
              {SPECIALISTS.map(([name, role, email]) => (
                <div key={email} className="flex items-center justify-between gap-4 px-4 py-4">
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium">{name}</p>
                    <p className="text-[13px] text-ink-400">{role}</p>
                  </div>
                  <a
                    href={`mailto:${email}`}
                    className="shrink-0 text-[13px] text-brand-500 hover:underline"
                  >
                    Email
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="card mt-6 p-6">
            <h3 className="text-[19px]">Viewing a lot in person</h3>
            <p className="mt-2.5 text-[14px] leading-relaxed text-ink-500">
              Cars are held at our Bridgehampton facility and can be viewed by appointment seven
              days a week during a sale. Call the office or ask in the comments on the lot page and
              we will arrange it.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
