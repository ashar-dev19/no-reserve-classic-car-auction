"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

const STATUSES = [
  ["open", "Open now"],
  ["live", "Live"],
  ["sold", "Sold"],
  ["all", "Everything"],
] as const;

const SORTS = [
  ["ending", "Ending soonest"],
  ["newest", "Newly listed"],
  ["price_desc", "Highest bid"],
  ["price_asc", "Lowest bid"],
  ["bids", "Most bids"],
] as const;

export function LotFilters({ makes, categories }: { makes: string[]; categories: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [open, setOpen] = useState(false);

  const push = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value == null || value === "") next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  // Debounced search so each keystroke does not fire a navigation.
  useEffect(() => {
    const current = params.get("q") ?? "";
    if (search === current) return;
    const id = setTimeout(() => push({ q: search || null }), 350);
    return () => clearTimeout(id);
  }, [search, params, push]);

  const status = params.get("status") ?? "open";
  const sort = params.get("sort") ?? "ending";
  const make = params.get("make") ?? "";
  const category = params.get("category") ?? "";
  const noReserve = params.get("noReserve") === "1";

  const activeCount =
    (make ? 1 : 0) + (category ? 1 : 0) + (noReserve ? 1 : 0) + (status !== "open" ? 1 : 0);

  return (
    <div className="border-b border-ink-100 bg-white">
      <div className="flex flex-wrap items-center gap-3 py-4">
        <div className="relative min-w-[220px] flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by make, model or keyword"
            aria-label="Search lots"
            className="field pl-11 pr-11"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 transition-colors hover:text-ink-900"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUSES.map(([value, label]) => (
            <button
              key={value}
              onClick={() => push({ status: value === "open" ? null : value })}
              className={`display h-11 rounded-sm border px-3.5 text-[12px] font-bold uppercase tracking-[0.07em] transition-colors ${
                status === value
                  ? "border-ink-900 bg-ink-900 text-white"
                  : "border-ink-200 text-ink-500 hover:border-ink-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="btn btn-outline"
          aria-expanded={open}
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeCount > 0 && (
            <span className="num grid h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-[11px] text-white">
              {activeCount}
            </span>
          )}
        </button>

        <select
          value={sort}
          onChange={(e) => push({ sort: e.target.value === "ending" ? null : e.target.value })}
          aria-label="Sort lots"
          className="field w-auto min-w-[180px]"
        >
          {SORTS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {open && (
        <div className="slide-up grid gap-4 border-t border-ink-100 py-4 sm:grid-cols-3">
          <div>
            <label htmlFor="f-make" className="label">
              Make
            </label>
            <select
              id="f-make"
              value={make}
              onChange={(e) => push({ make: e.target.value || null })}
              className="field"
            >
              <option value="">All makes</option>
              {makes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="f-category" className="label">
              Category
            </label>
            <select
              id="f-category"
              value={category}
              onChange={(e) => push({ category: e.target.value || null })}
              className="field"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-4">
            <label className="flex h-11 cursor-pointer items-center gap-2.5 text-[14px]">
              <input
                type="checkbox"
                checked={noReserve}
                onChange={(e) => push({ noReserve: e.target.checked ? "1" : null })}
                className="h-4 w-4 accent-[#f90000]"
              />
              No reserve only
            </label>
            {activeCount > 0 && (
              <button
                onClick={() => {
                  setSearch("");
                  router.push(pathname, { scroll: false });
                }}
                className="btn btn-outline btn-sm"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
