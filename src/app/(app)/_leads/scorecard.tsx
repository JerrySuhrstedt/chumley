import { localToday } from "@/lib/today";
import type { Lead } from "@/db/schema";

export function Scorecard({ leads }: { leads: Lead[] }) {
  const today = localToday();

  const activeDeals = leads.filter(
    (l) => l.stage !== "won" && l.stage !== "lost"
  ).length;

  const closedRevenue = leads
    .filter((l) => l.stage === "won")
    .reduce((sum, l) => sum + Number(l.value ?? 0), 0);

  const dueToday = leads.filter(
    (l) => l.nextActionDue && l.nextActionDue <= today
  ).length;

  const stats = [
    { label: "Deals working", value: activeDeals.toLocaleString() },
    { label: "Money won", value: `$${closedRevenue.toLocaleString()}` },
    { label: "Due today", value: dueToday.toLocaleString() },
  ];

  return (
    <div className="flex gap-2 sm:gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex-1 rounded-lg bg-black/[0.05] px-3 py-1.5 sm:flex-none sm:px-4 sm:py-2"
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
