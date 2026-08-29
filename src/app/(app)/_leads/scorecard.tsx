"use client";

import { useLocalToday } from "../dashboard/local-heading";
import type { Lead } from "@/db/schema";

export function Scorecard({ leads }: { leads: Lead[] }) {
  // The board is server-prerendered and Vercel runs in UTC, so "due today"
  // has to wait for the browser's own date. Null until it answers, which is
  // what keeps the server HTML and the first client render in step.
  const today = useLocalToday();

  const activeDeals = leads.filter(
    (l) => l.stage !== "won" && l.stage !== "lost"
  ).length;

  const closedRevenue = leads
    .filter((l) => l.stage === "won")
    .reduce((sum, l) => sum + Number(l.value ?? 0), 0);

  const dueToday = today
    ? leads.filter((l) => l.nextActionDue && l.nextActionDue <= today).length
    : null;

  const stats = [
    { label: "Deals working", value: activeDeals.toLocaleString() },
    { label: "Money won", value: `$${closedRevenue.toLocaleString()}` },
    { label: "Due today", value: dueToday === null ? "—" : dueToday.toLocaleString() },
  ];

  return (
    <div className="flex gap-2 sm:gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex-1 rounded-lg bg-black/[0.05] px-3 py-2 sm:flex-none sm:px-4"
        >
          <p className="text-lg font-semibold text-[var(--board-ink)] sm:text-xl">
            {stat.value}
          </p>
          <p className="text-xs whitespace-nowrap text-[var(--board-ink-muted)]">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}
