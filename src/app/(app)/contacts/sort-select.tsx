"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import {
  SORTS,
  defaultDir,
  dirLabel,
  type SortDir,
  type SortKey,
} from "./sort";

/**
 * Field on the left, direction on the right. The toggle says what it will
 * give you rather than showing a bare arrow, since "Z-A" is clearer than
 * an icon pointing somewhere.
 */
export function SortSelect({
  value,
  dir,
}: {
  value: SortKey;
  dir: SortDir;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function go(nextKey: SortKey, nextDir: SortDir) {
    const query = new URLSearchParams(params.toString());

    if (nextKey === "last") query.delete("sort");
    else query.set("sort", nextKey);

    if (nextDir === defaultDir(nextKey)) query.delete("dir");
    else query.set("dir", nextDir);

    // Opening a record is a separate concern; do not carry it through.
    query.delete("open");

    const qs = query.toString();
    router.push(qs ? `/contacts?${qs}` : "/contacts");
  }

  return (
    <div className="flex h-10 shrink-0 items-stretch gap-2">
      <label className="relative flex items-center">
        <ArrowUpDown className="pointer-events-none absolute left-2.5 size-4 text-slate-400" />
        <span className="sr-only">Sort contacts by</span>
        <select
          value={value}
          // Each field starts in the direction that reads naturally.
          onChange={(e) =>
            go(e.target.value as SortKey, defaultDir(e.target.value as SortKey))
          }
          className="h-10 w-full appearance-none rounded-md border border-slate-300 bg-white pr-8 pl-8 text-sm text-slate-900 outline-none focus:border-[var(--board-bg)] focus:ring-3 focus:ring-[var(--board-bg)]/20 sm:w-44"
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
          fill="none"
        >
          <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </label>

      <button
        type="button"
        onClick={() => go(value, dir === "asc" ? "desc" : "asc")}
        title="Reverse the order"
        className="flex h-10 shrink-0 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        {dir === "asc" ? (
          <ArrowUp className="size-4 text-slate-400" />
        ) : (
          <ArrowDown className="size-4 text-slate-400" />
        )}
        {dirLabel(value, dir)}
      </button>
    </div>
  );
}
