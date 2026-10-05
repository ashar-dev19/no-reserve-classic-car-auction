/** All money is stored and passed around as integer cents. */

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const USD_CENTS = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

/** $169,999 — drops cents, which auction figures never carry. */
export function money(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return USD.format(Math.round(cents / 100));
}

/** $169,999.00 — for invoices, where cents matter. */
export function moneyExact(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return USD_CENTS.format(cents / 100);
}

export function compactMoney(cents: number): string {
  const d = cents / 100;
  if (d >= 1_000_000) return `$${(d / 1_000_000).toFixed(d % 1_000_000 === 0 ? 0 : 1)}M`;
  if (d >= 1_000) return `$${Math.round(d / 1_000)}K`;
  return `$${Math.round(d)}`;
}

export function numberFmt(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US").format(n);
}

/** "2h 14m 06s" style countdown, or "Ended". */
export function countdown(msRemaining: number): string {
  if (msRemaining <= 0) return "Ended";
  const s = Math.floor(msRemaining / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${String(m).padStart(2, "0")}m`;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(sec).padStart(2, "0")}s`;
  return `${m}m ${String(sec).padStart(2, "0")}s`;
}

/** Urgency tier drives colour, not just text. */
export function urgency(msRemaining: number): "ended" | "critical" | "soon" | "normal" {
  if (msRemaining <= 0) return "ended";
  if (msRemaining < 5 * 60_000) return "critical";
  if (msRemaining < 60 * 60_000) return "soon";
  return "normal";
}

const DT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const DATE_ONLY = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function dateTime(ms: number): string {
  return DT.format(new Date(ms));
}

export function dateOnly(ms: number): string {
  return DATE_ONLY.format(new Date(ms));
}

export function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const s = Math.floor(diff / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return dateOnly(ms);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
