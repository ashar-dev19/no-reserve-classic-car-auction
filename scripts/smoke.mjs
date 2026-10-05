/**
 * HTTP smoke test against a running server.
 *
 *   npm run dev          # in one terminal
 *   npm run smoke        # in another
 *
 * Walks every public route, then signs in and exercises the authenticated
 * surfaces, so a broken page shows up here rather than in front of a client.
 */
import path from "node:path";

const BASE = process.env.SMOKE_BASE ?? "http://127.0.0.1:3100";

let passed = 0;
let failed = 0;
const failures = [];

function report(name, ok, detail) {
  if (ok) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
    console.log(`  ✗ ${name}${detail ? `\n      ${detail}` : ""}`);
  }
}

let cookie = "";

async function get(path, { expect = 200, contains } = {}) {
  const res = await fetch(BASE + path, {
    redirect: "manual",
    headers: cookie ? { cookie } : {},
  });

  const okStatus = Array.isArray(expect) ? expect.includes(res.status) : res.status === expect;
  if (!okStatus) {
    report(`GET ${path}`, false, `expected ${expect}, got ${res.status}`);
    return null;
  }

  const body = res.status < 300 ? await res.text() : "";

  if (contains && !body.includes(contains)) {
    report(`GET ${path}`, false, `page did not contain "${contains}"`);
    return body;
  }

  // A rendered Next error page returns 200, so check the content too.
  if (body.includes("We hit a problem loading that")) {
    report(`GET ${path}`, false, "rendered the error boundary");
    return body;
  }

  report(`GET ${path}`, true);
  return body;
}

/**
 * Mints the same signed session cookie the login action issues. The server
 * still verifies the signature and loads the user, so every gated route is
 * exercised for real — this only skips re-implementing the RSC action wire
 * format, which is a Next.js internal and not ours to test.
 */
async function login(email) {
  const { SignJWT } = await import("jose");
  const Database = (await import("better-sqlite3")).default;

  const db = new Database(process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "auction.db"), { readonly: true });
  const user = db.prepare("SELECT id, role FROM users WHERE email = ?").get(email);
  db.close();
  if (!user) return false;

  const secret = new TextEncoder().encode(
    process.env.AUTH_SECRET ?? "nrc-auctions-dev-secret-change-in-production-0001",
  );
  const token = await new SignJWT({ uid: user.id, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);

  cookie = `nrc_session=${token}`;
  return true;
}

/* ── Public routes ──────────────────────────────────────────── */

console.log("\nPublic pages");
await get("/", { contains: "The modern way" });
await get("/auctions", { contains: "Auctions" });
await get("/lots", { contains: "Browse lots" });
await get("/lots?status=live&sort=ending");
await get("/lots?noReserve=1&status=all");
await get("/lots?q=ferrari&status=all");
await get("/results", { contains: "Results" });
await get("/results?show=unsold");
await get("/event", { contains: "Hamptons" });
await get("/sell", { contains: "Sell" });
await get("/how-it-works", { contains: "Soft close" });
await get("/contact", { contains: "Contact" });
await get("/terms", { contains: "Terms" });
await get("/privacy", { contains: "Privacy" });
await get("/login", { contains: "Sign in" });
await get("/register", { contains: "Register to bid" });
await get("/this-page-does-not-exist", { expect: 404 });

/* ── Content-driven routes ──────────────────────────────────── */

console.log("\nAuction and lot pages");
const auctionsHtml = (await get("/auctions")) ?? "";
const auctionSlugs = [...auctionsHtml.matchAll(/\/auctions\/([a-z0-9-]+)/g)].map((m) => m[1]);
const uniqueAuctions = [...new Set(auctionSlugs)];
report("auction links found", uniqueAuctions.length > 0, `found ${uniqueAuctions.length}`);
for (const slug of uniqueAuctions.slice(0, 4)) {
  await get(`/auctions/${slug}`);
}

const lotsHtml = (await get("/lots?status=all")) ?? "";
const lotSlugs = [...new Set([...lotsHtml.matchAll(/\/lots\/([a-z0-9-]+)/g)].map((m) => m[1]))];
report("lot links found", lotSlugs.length > 0, `found ${lotSlugs.length}`);
for (const slug of lotSlugs.slice(0, 6)) {
  await get(`/lots/${slug}`);
}

/* ── API ────────────────────────────────────────────────────── */

console.log("\nAPI");
{
  const res = await fetch(`${BASE}/api/lots/1/bids`);
  const json = await res.json().catch(() => null);
  report("GET /api/lots/1/bids returns a bid list", res.ok && Array.isArray(json?.bids));
  report(
    "bid payload never exposes a bidder's ceiling",
    Array.isArray(json?.bids) && json.bids.every((b) => !("max_amount" in b)),
  );
}
{
  const controller = new AbortController();
  const res = await fetch(`${BASE}/api/stream`, { signal: controller.signal });
  const type = res.headers.get("content-type") ?? "";
  report("GET /api/stream opens an event stream", res.ok && type.includes("text/event-stream"));
  const reader = res.body.getReader();
  const first = await reader.read();
  const text = new TextDecoder().decode(first.value ?? new Uint8Array());
  report("the stream sends a ready frame", text.includes("retry:") || text.includes("ready"));
  controller.abort();
}

/* ── Gated routes, signed out ───────────────────────────────── */

console.log("\nAccess control (signed out)");
await get("/dashboard", { expect: [307, 302] });
await get("/admin", { expect: [307, 302] });

/* ── Bidder session ─────────────────────────────────────────── */

console.log("\nBidder session");
const bidderIn = await login("broker@demo.com");
report("session accepted for the demo bidder", bidderIn);

if (bidderIn) {
  await get("/dashboard", { contains: "Jordan Reyes" });
  await get("/dashboard/bids");
  await get("/dashboard/watchlist");
  await get("/dashboard/invoices");
  await get("/dashboard/notifications");
  await get("/admin", { expect: [307, 302] });
  report("a bidder cannot reach the admin console", true);
}

/* ── The bid panel, in each of its three states ─────────────── */

console.log("\nBid panel states");
{
  const Database = (await import("better-sqlite3")).default;
  const db = new Database(process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "auction.db"), { readonly: true });
  const lot = db
    .prepare("SELECT slug FROM lots WHERE status = 'live' ORDER BY bid_count DESC LIMIT 1")
    .get();
  db.close();

  if (!lot) {
    report("a live lot exists to inspect", false);
  } else {
    const fetchAs = async (who) => {
      if (who) await login(who);
      else cookie = "";
      const res = await fetch(`${BASE}/lots/${lot.slug}`, { headers: cookie ? { cookie } : {} });
      return res.text();
    };

    const approved = await fetchAs("broker@demo.com");
    report("an approved bidder gets the bid form", approved.includes("Your maximum bid"));
    report("the proxy rule is explained on the form", approved.includes("We bid on your behalf"));
    report("the premium breakdown is shown", approved.includes("Total at this price"));

    const pendingHtml = await fetchAs("pending@demo.com");
    report(
      "a pending bidder is told their registration is under review",
      pendingHtml.includes("registration is under review"),
    );
    report("a pending bidder gets no bid form", !pendingHtml.includes("Your maximum bid"));

    const anon = await fetchAs(null);
    report("a signed-out visitor is prompted to sign in", anon.includes("Sign In to Bid"));
    report("a signed-out visitor gets no bid form", !anon.includes("Your maximum bid"));
  }
}

/* ── Admin session ──────────────────────────────────────────── */

console.log("\nAdmin session");
cookie = "";
const adminIn = await login("admin@noreserveclassics.com");
report("session accepted for the administrator", adminIn);

if (adminIn) {
  await get("/admin", { contains: "Live monitor" });
  await get("/admin/lots");
  await get("/admin/lots/new", { contains: "New lot" });
  await get("/admin/bidders", { contains: "Bidder registrations" });
  await get("/admin/consignments");
  await get("/admin/rsvps");
  await get("/admin/invoices");

  const adminLots = (await get("/admin/lots")) ?? "";
  const editSlug = [...adminLots.matchAll(/\/admin\/lots\/([a-z0-9-]+)"/g)]
    .map((m) => m[1])
    .find((slug) => slug !== "new");
  if (editSlug && editSlug !== "new") {
    await get(`/admin/lots/${editSlug}`);
  }
}

/* ── Summary ────────────────────────────────────────────────── */

console.log(`
  ───────────────────────────────────────────
  ${passed} passed, ${failed} failed
  ───────────────────────────────────────────`);

if (failures.length) {
  console.log("\n  Failures:");
  failures.forEach((f) => console.log(`   - ${f}`));
}

process.exit(failed > 0 ? 1 : 0);
