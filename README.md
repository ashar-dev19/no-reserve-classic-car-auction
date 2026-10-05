# No Reserve Classics — Auction Platform

A complete, working collector-car auction platform — built as a pitch demo for a
Columbus Day weekend sale in the Hamptons, and structured as a general auction
system that can be rebranded and re-pointed at any category.

Presented in No Reserve Classics branding as a concept piece. The logo, palette
and contact details are taken from noreserveclassics.com; swap the files in
`public/brand/` and the tokens in `globals.css` to put any other name on it.

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · SQLite · Server-Sent Events

---

## Running it

```bash
npm install
npm run seed     # builds data/auction.db with a full demo catalogue
npm run dev      # http://localhost:3000
```

`npm run seed` is destructive — it deletes and rebuilds the database. Run it
again any time the demo drifts (lots close as the clock runs).

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@noreserveclassics.com` | `admin1234` |
| Approved bidder | `broker@demo.com` | `demo1234` |
| Pending bidder | `pending@demo.com` | `demo1234` |

The pending account exists to demonstrate the approval gate: it can browse,
watch and ask questions, but the bid form is withheld until an administrator
issues a paddle.

### Checks

```bash
npm run test:engine   # 51 assertions against the bidding engine
npm run smoke         # 62 HTTP checks (needs the dev server running)
npm run build         # production build + full type check
```

---

## The design

The palette and typography are lifted from
[noreserveclassics.com](https://www.noreserveclassics.com), which the client
referenced:

| Token | Value | Use |
| --- | --- | --- |
| `--color-brand-500` | `#f90000` | Primary actions, live state, urgency |
| `--color-brand-600` | `#980000` | Hover and pressed states |
| `--color-amber-ac` | `#ff8400` | No-reserve lots, warnings, pending states |
| `--color-ink-900` | `#111111` | Header, footer, dark sections |
| `--color-ink-50` | `#f5f5f5` | Section banding |
| `--font-display` | Roboto Condensed | Headings, buttons, labels, figures |
| `--font-sans` | Roboto | Body copy |

The logo lives in `public/brand/` — `nrc-logo.png` for light backgrounds,
`nrc-logo-white.png` for the dark header and footer, `nrc-mark.png` for the
monogram, and `src/app/icon.png` as the favicon. The white version is derived
from the original by recolouring the artwork and keeping the alpha channel.

Everything is defined once in `src/app/globals.css` as Tailwind v4 theme tokens.
Rebranding is a matter of editing that block — the components reference tokens,
never raw hex.

Design choices worth naming: flat colour rather than gradients, 2–4px radii for
a saleroom feel rather than a consumer-app feel, condensed uppercase for
anything numeric or structural, with tabular figures everywhere money or time
appears so columns of prices line up and countdowns do not jitter.

Photography comes from `auction-assets/`, which arrived base64-encoded with AVIF
payloads; `_decoded/` holds the decoded originals and `public/cars/` the
optimised JPEGs actually served.

---

## How the auction engine works

All of it lives in `src/lib/auction.ts`, with the increment ladder split into
`src/lib/increments.ts` so the bid form can compute the same minimum on the
client that the server enforces.

**Proxy bidding.** A bidder names a ceiling, not a price. The engine bids on
their behalf one increment at a time, only as high as competition forces. A
ceiling is never shown to another bidder, never returned by the API, and never
rendered in the bid history — only the visible bids it produced.

**The duel.** When a challenger's ceiling exceeds the leader's, the price
settles one increment above the beaten ceiling and the leader changes. When it
does not, the price rises to one increment above the challenger and the leader
holds. On exactly equal ceilings the earlier bidder keeps the lot.

**The reserve lift.** Proxy bidding only raises a price as far as competition
demands — which means a lot with a single bidder willing to pay well above the
reserve would otherwise never meet it. When the ceiling standing behind the
price covers the reserve, the engine lifts the price to the reserve exactly, and
no further. This was a real bug caught by the test suite rather than a
theoretical one.

**Soft close.** Any bid inside the final two minutes pushes the close out to two
minutes from that bid, without limit. Sniping cannot decide a lot, and nobody
has to sit on the page at 4:59.

**Settlement.** `sweep()` opens lots that are due and settles those whose clock
has run out — assigning the winner, honouring the reserve, raising the invoice
with buyer's premium, and notifying everyone who bid. It is idempotent and
cheap, and runs both on page loads and on a five-second ticker inside the SSE
route, so there is no separate worker to keep alive.

### Live updates

`/api/stream` is a Server-Sent Events endpoint fed by an in-process event bus
(`src/lib/events.ts`). Every browser tab holds one connection regardless of how
many components subscribe — `useAuctionStream` reference-counts a shared
`EventSource` — and components filter by lot id. Prices, bid counts, countdowns,
reserve status and the admin monitor all update without a refresh.

For a multi-node deployment, `publish()` in `events.ts` is the single seam to
swap for Redis pub/sub. Nothing else changes.

---

## What's built

**Public** — home, auction calendar, auction detail with catalogue tabs,
filterable lot browser with search and pagination, full lot pages (gallery with
lightbox, specification table, highlights, published flaws, live bid history,
public Q&A), results archive, the Hamptons event page with RSVP, consignment
submission, a plain-language rules page, contact, terms and privacy.

**Bidder** — registration and sign-in, proxy bidding with quick-bid buttons and
a live cost breakdown, watchlist, bid tracking with standing (leading / outbid /
won / lost), invoices, and a notification feed fed by outbid, closing and
settlement events.

**Administrator** — dashboard with live monitor (close or extend any lot in
flight), full lot CRUD with a catalogue editor, bidder approval with per-account
bid limits, consignment triage, event RSVP list, and invoice management.

---

## Structure

```
src/
  app/
    actions/        server actions — auth, bidding, public forms, admin
    api/            SSE stream, bid history endpoint
    admin/          admin console
    dashboard/      bidder account
    …               public pages
  components/       UI, client-side live-update logic
  lib/
    auction.ts      the engine: proxy bidding, soft close, settlement
    increments.ts   the ladder, shared by client and server
    events.ts       in-process pub/sub for SSE
    db.ts           SQLite connection and schema
    auth.ts         scrypt hashing, JWT sessions
    queries.ts      read models for pages
scripts/
  seed.mts          rebuilds the demo catalogue
  lots.mts          catalogue content
  test-engine.mts   engine test suite
  smoke.mjs         HTTP smoke test
```

Money is integer cents everywhere — in the database, through the engine, across
the wire — and formatted only at the point of display.

---

## Deploying

The app keeps its database on disk and fans live bids out through an in-process
event bus. Both want **one long-running Node process with a persistent volume** —
not a serverless platform that tears the process down between requests.

On Vercel this would build and then fail quietly: the filesystem is read-only so
the database cannot be created, each request may land on a different instance so
live updates would not reach other viewers, and the sweep ticker that closes lots
would never run.

### Railway (recommended)

```bash
git init && git add -A && git commit -m "Auction platform"
```

Push to GitHub, then in Railway: **New Project → Deploy from GitHub repo**. It
reads the `Dockerfile` automatically.

Then, before the first deploy finishes:

1. **Variables** → add `AUTH_SECRET`. Generate one with
   `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.
   Without it the app falls back to a secret published in this repository and
   administrator sessions can be forged.
2. **Volumes** → add a volume mounted at `/data`. Without it the database is
   wiped on every redeploy.

The container seeds itself on first boot, so the demo catalogue is there as soon
as it starts — with countdowns measured from container start rather than from
build time. To reset before a presentation, set `SEED_ON_START=force` and
redeploy, then remove the variable again.

### Render

Same `Dockerfile`, and `render.yaml` describes the whole service. Create it with
**New → Blueprint** pointed at the repository; the disk and `AUTH_SECRET` come
from the blueprint, so there is nothing to configure by hand.

One thing to get right: **the free tier will not work.** A persistent disk needs
a paid instance type, and free services sleep after fifteen minutes of
inactivity. Without a disk the database is recreated empty on every wake, and
the sleep also drops the live-update connections and the ticker that closes
lots. Use Starter or above.

### Fly.io

Also works from the same `Dockerfile`. Create a volume, mount it at `/data`, set
`AUTH_SECRET`, and keep the app at one machine (`fly scale count 1`).

### Keep it to one instance

`numReplicas` is pinned to 1 in `railway.json`, and that matters. The live-bid
fan-out is in-process, so a second replica would serve a different copy of the
database and its own event bus — two bidders could see two different prices on
the same lot.

Scaling past one instance means moving the database to Postgres or Turso and
putting Redis behind `publish()` in `events.ts`. That function is the only seam
the rest of the code goes through, which is why it exists.

### Local container build

```bash
docker build -t nrc-auction .
docker run -p 3000:3000 -v nrc-data:/data -e AUTH_SECRET=dev-secret nrc-auction
```

---

## Notes before this goes to a client

The demo is complete and self-contained; these are the things that would need
real decisions before it carries real money.

- **Payments.** Invoices are raised and tracked, but settlement is recorded
  manually by an administrator. Wiring Stripe or an ACH provider is a known
  piece of work, not a surprise.
- **Email and SMS.** Notifications are written to the database and shown in-app.
  Nothing is sent. A provider needs choosing before launch.
- **Database.** SQLite is the right call for a demo that must run anywhere with
  no setup. For production on a single node it is still fine; for multiple nodes
  it needs to become Postgres, and the SSE bus needs Redis behind it.
- **Identity checks.** Bidder approval is a human decision in the admin console,
  with no KYC or deposit hold. A sale of this size would likely want both.
- **Photography.** The demo uses stock imagery as a stand-in. Real lots need
  real photographs, and the inspection workflow that produces them.
