"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { SORTS, type SortKey } from "./sort";

/**
 * Native select on purpose: it is one tap on a phone, opens the platform's
 * own picker, and needs no keyboard handling of its own.
 */
export function SortSelect({ value }: { value: SortKey }) {
  const router = useRouter();
  const params = useSearchParams();

  function change(next: string) {
    const query = new URLSearchParams(params.toString());
    if (next === "last") query.delete("sort");
    else query.set("sort", next);
    // Opening a record is a separate concern; do not carry it through a sort.
    query.delete("open");
    const qs = query.toString();
    router.push(qs ? `/contacts?${qs}` : "/contacts");
  }

  return (
    <label className="relative flex h-10 shrink-0 items-center">
      <ArrowUpDown className="pointer-events-none absolute left-2.5 size-4 text-slate-400" />
      <span className="sr-only">Sort contacts</span>
      <select
        value={value}
        onChange={(e) => change(e.target.value)}
        className="h-10 w-full appearance-none rounded-md border border-slate-300 bg-white pr-8 pl-8 text-sm text-slate-900 outline-none focus:border-[var(--board-bg)] focus:ring-3 focus:ring-[var(--board-bg)]/20 sm:w-56"
      >
        {SORTS.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-2.5 size-4 text-slate-400"
        fill="currentColor"
      >
        <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    </label>
  );
}
