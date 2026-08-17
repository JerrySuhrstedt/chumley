import type { Lead } from "@/db/schema";

export function Scorecard({ leads }: { leads: Lead[] }) {
  const today = new Date().toISOString().slice(0, 10);

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
    { label: "Active Deals", value: activeDeals.toLocaleString() },
    { label: "Closed Revenue", value: `$${closedRevenue.toLocaleString()}` },
    { label: "Tasks Due Today", value: dueToday.toLocaleString() },
  ];

  return (
    <div className="flex gap-2 sm:gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex-1 rounded-lg bg-white/15 px-3 py-2 backdrop-blur-sm sm:flex-none sm:px-4"
        >
          <p className="text-lg font-semibold text-white sm:text-xl">
            {stat.value}
          </p>
          <p className="text-xs whitespace-nowrap text-white/80">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}
