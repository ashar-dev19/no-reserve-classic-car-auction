"use client";

import { useEffect, useState } from "react";
import { countdown, urgency } from "@/lib/format";
import { useTicker } from "./use-auction-stream";

const TONE = {
  critical: "text-brand-500",
  soon: "text-amber-ac",
  normal: "text-ink-900",
  ended: "text-ink-400",
} as const;

export function Countdown({
  endsAt,
  className = "",
  prefix,
  showEndedLabel = "Ended",
}: {
  endsAt: number;
  className?: string;
  prefix?: string;
  showEndedLabel?: string;
}) {
  useTicker();
  // Render nothing time-dependent until mounted, or the server HTML and the
  // first client paint disagree and React complains.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const remaining = endsAt - Date.now();
  const tone = urgency(remaining);

  if (!mounted) {
    return <span className={`num tabular-nums ${className}`}>&nbsp;</span>;
  }

  return (
    <span className={`num tabular-nums ${TONE[tone]} ${className}`}>
      {prefix && remaining > 0 ? `${prefix} ` : ""}
      {remaining > 0 ? countdown(remaining) : showEndedLabel}
    </span>
  );
}

/** Larger, segmented clock for the lot page and auction hero. */
export function CountdownBlocks({ endsAt }: { endsAt: number }) {
  useTicker();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const remaining = Math.max(0, endsAt - Date.now());
  const tone = urgency(remaining);
  const s = Math.floor(remaining / 1000);
  const parts: Array<[string, number]> = [
    ["Days", Math.floor(s / 86400)],
    ["Hours", Math.floor((s % 86400) / 3600)],
    ["Min", Math.floor((s % 3600) / 60)],
    ["Sec", s % 60],
  ];

  if (!mounted) return <div className="h-[58px]" />;

  if (remaining <= 0) {
    return (
      <p className="display text-[22px] uppercase tracking-wide text-ink-400">Bidding closed</p>
    );
  }

  return (
    <div className="flex gap-2">
      {parts.map(([label, value]) => (
        <div
          key={label}
          className={`min-w-[58px] rounded-sm border px-2 py-1.5 text-center ${
            tone === "critical" ? "border-brand-500 bg-brand-50" : "border-ink-100 bg-ink-50"
          }`}
        >
          <div
            className={`num display text-[22px] font-bold leading-none tabular-nums ${
              tone === "critical" ? "text-brand-500" : "text-ink-900"
            }`}
          >
            {String(value).padStart(2, "0")}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-ink-400">{label}</div>
        </div>
      ))}
    </div>
  );
}
