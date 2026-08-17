import { Card, CardContent } from "@/components/ui/card";
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
    {
      label: "Closed Revenue",
      value: `$${closedRevenue.toLocaleString()}`,
    },
    { label: "Tasks Due Today", value: dueToday.toLocaleString() },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="py-3">
          <CardContent className="px-4">
            <p className="text-xl font-semibold md:text-2xl">{stat.value}</p>
            <p className="text-xs text-muted-foreground md:text-sm">
              {stat.label}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
