import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink-100 pb-5">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="text-[30px] leading-tight sm:text-[36px]">{title}</h2>
        {description && (
          <p className="mt-2.5 text-[15px] leading-relaxed text-ink-400">{description}</p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className="display group flex shrink-0 items-center gap-1.5 pb-1 text-[13px] font-bold uppercase tracking-[0.08em] text-brand-500"
        >
          {action.label}
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
