import type { LucideIcon } from "lucide-react";

export function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: LucideIcon;
  tone?: "default" | "brand" | "gain" | "warn";
}) {
  const accent =
    tone === "brand"
      ? "text-brand-500"
      : tone === "gain"
        ? "text-gain"
        : tone === "warn"
          ? "text-amber-ac"
          : "text-ink-300";

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.12em] text-ink-400">{label}</p>
        {Icon && <Icon size={17} className={accent} strokeWidth={1.8} />}
      </div>
      <p className="num display mt-2 text-[30px] font-bold leading-none tabular-nums">{value}</p>
      {sub && <p className="mt-1.5 text-[12px] text-ink-400">{sub}</p>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-16 text-center">
      <Icon size={28} className="text-ink-200" strokeWidth={1.6} />
      <h2 className="mt-4 text-[20px]">{title}</h2>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-ink-400">{body}</p>
      {action && (
        <a href={action.href} className="btn btn-outline mt-6">
          {action.label}
        </a>
      )}
    </div>
  );
}
