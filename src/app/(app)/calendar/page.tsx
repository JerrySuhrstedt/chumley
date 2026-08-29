import Link from "next/link";
import { eq } from "drizzle-orm";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { getCurrentOrg } from "@/lib/org";
import { CalendarDay } from "./day-cell";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function CalendarPage({
  searchParams,
}: PageProps<"/calendar">) {
  const current = await getCurrentOrg();
  if (!current) return null;

  const { month } = await searchParams;
  const base =
    typeof month === "string" && /^\d{4}-\d{2}$/.test(month)
      ? parseISO(`${month}-01`)
      : new Date();

  const gridStart = startOfWeek(startOfMonth(base));
  const gridEnd = endOfWeek(endOfMonth(base));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const rows = await db
    .select()
    .from(leads)
    .where(eq(leads.orgId, current.org.id));

  const byDay = new Map<string, typeof rows>();
  for (const lead of rows) {
    if (!lead.nextActionDue) continue;
    const key = lead.nextActionDue;
    byDay.set(key, [...(byDay.get(key) ?? []), lead]);
  }

  // "Today" and the overdue tint depend on the reader's timezone, so they are
  // decided in CalendarDay on the client rather than against the server's UTC
  // clock here.
  const prev = format(subMonths(base, 1), "yyyy-MM");
  const next = format(addMonths(base, 1), "yyyy-MM");

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Calendar</h1>
            <p className="text-sm text-slate-500">
              When your next steps are due.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/calendar?month=${prev}`}
              aria-label="Previous month"
              className="flex size-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
            >
              <ChevronLeft className="size-4" />
            </Link>
            <span className="w-36 text-center text-sm font-semibold text-slate-800">
              {format(base, "MMMM yyyy")}
            </span>
            <Link
              href={`/calendar?month=${next}`}
              aria-label="Next month"
              className="flex size-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
            >
              <ChevronRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="px-2 py-2 text-center text-xs font-semibold text-slate-500"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const items = byDay.get(key) ?? [];

              return (
                <CalendarDay
                  key={key}
                  dayKey={key}
                  dayNum={format(day, "d")}
                  inMonth={isSameMonth(day, base)}
                  items={items.map((lead) => ({
                    id: lead.id,
                    name: lead.name,
                    nextActionText: lead.nextActionText,
                  }))}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
