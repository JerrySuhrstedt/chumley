"use client";

import { useLocalToday } from "../dashboard/local-heading";
import { cn } from "@/lib/utils";

type DayItem = { id: string; name: string; nextActionText: string | null };

/**
 * One cell of the month grid. Split out as a client component so "today" and
 * "overdue" are decided by the reader's own date rather than the server's.
 *
 * The page is server-rendered and Vercel runs in UTC, so from late afternoon
 * on, its idea of today was already tomorrow in Arizona: the highlight sat on
 * the wrong cell and steps due today coloured as overdue. None of that is
 * knowable on the server, so it is left to the browser here.
 */
export function CalendarDay({
  dayKey,
  dayNum,
  inMonth,
  items,
}: {
  dayKey: string;
  dayNum: string;
  inMonth: boolean;
  items: DayItem[];
}) {
  // Null on the server and the first client render, where today is unknown.
  // Nothing date-relative is drawn until the browser answers, which also
  // keeps the server HTML and hydration in step.
  const today = useLocalToday();
  const isToday = today !== null && dayKey === today;
  const isPast = today !== null && dayKey < today;

  return (
    <div
      className={cn(
        "min-h-24 border-r border-b border-slate-100 p-1.5",
        !inMonth && "bg-slate-50/60"
      )}
    >
      <div
        className={cn(
          "mb-1 flex size-6 items-center justify-center rounded-full text-xs",
          isToday
            ? "bg-[var(--brand)] font-semibold text-white"
            : inMonth
              ? "text-slate-700"
              : "text-slate-400"
        )}
      >
        {dayNum}
      </div>

      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <div
            key={item.id}
            title={`${item.name}: ${item.nextActionText}`}
            className={cn(
              "truncate rounded px-1.5 py-1 text-[11px] leading-tight",
              isPast ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-800"
            )}
          >
            <span className="font-medium">{item.name}</span>
            <span className="block truncate opacity-80">
              {item.nextActionText}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
