import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight } from "lucide-react";
import { db } from "@/db";
import { activities, leads, templates } from "@/db/schema";
import { getCurrentOrg } from "@/lib/org";
import { activityMeta, outcomeMeta } from "../_leads/activity-meta";
import { CONTACT_STAGE, STAGES } from "../_leads/stages";
import { NextSteps } from "./next-steps";
import { PipelineFunnel } from "./pipeline-funnel";

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

export default async function DashboardPage() {
  const current = await getCurrentOrg();
  if (!current) return null;

  const [allLeads, recent, allTemplates] = await Promise.all([
    db.query.leads.findMany({
      where: eq(leads.orgId, current.org.id),
      with: { activities: true },
    }),
    db
      .select({
        id: activities.id,
        type: activities.type,
        outcome: activities.outcome,
        body: activities.body,
        createdAt: activities.createdAt,
        leadName: leads.name,
      })
      .from(activities)
      .innerJoin(leads, eq(activities.leadId, leads.id))
      .where(eq(activities.orgId, current.org.id))
      .orderBy(desc(activities.createdAt))
      .limit(8),
    db.select().from(templates).where(eq(templates.orgId, current.org.id)),
  ]);

  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const pipeline = allLeads.filter((l) => l.stage !== CONTACT_STAGE);
  const open = pipeline.filter((l) => l.stage !== "won" && l.stage !== "lost");

  const openValue = open.reduce((sum, l) => sum + Number(l.value ?? 0), 0);
  const closedValue = pipeline
    .filter((l) => l.stage === "won")
    .reduce((sum, l) => sum + Number(l.value ?? 0), 0);

  const dueLeads = pipeline
    .filter((l) => l.nextActionText && l.nextActionDue && l.nextActionDue <= today)
    .sort((a, b) => (a.nextActionDue ?? "").localeCompare(b.nextActionDue ?? ""));

  const overdueCount = dueLeads.filter(
    (l) => (l.nextActionDue ?? "") < today
  ).length;

  const noNextStep = open.filter((l) => !l.nextActionText).length;
  const contactCount = allLeads.filter(
    (l) => l.stage === CONTACT_STAGE
  ).length;

  const stats = [
    { label: "Active deals", value: open.length.toLocaleString() },
    { label: "Open pipeline", value: money(openValue) },
    { label: "Closed revenue", value: money(closedValue) },
    { label: "Due today", value: dueLeads.length.toLocaleString() },
  ];

  const byStage = STAGES.map((stage) => {
    const rows = pipeline.filter((l) => l.stage === stage.value);
    return {
      value: stage.value,
      label: stage.label,
      count: rows.length,
      amount: rows.reduce((sum, l) => sum + Number(l.value ?? 0), 0),
    };
  });

  // Lost is an exit, not a rung, so it sits beside the funnel rather than in it.
  const funnelStages = byStage.filter((s) => s.value !== "lost");
  const lostStage = byStage.find((s) => s.value === "lost")!;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div>
          <p className="text-sm text-slate-500">
            {now.toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            {greeting(now.getHours())}
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <p className="text-2xl font-semibold text-slate-900">
                {stat.value}
              </p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>

        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="font-semibold text-slate-900">
              What needs doing
              {overdueCount > 0 && (
                <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  {overdueCount} overdue
                </span>
              )}
            </h2>
          </div>
          <NextSteps
            leads={dueLeads}
            templates={allTemplates}
            today={today}
          />
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="font-semibold text-slate-900">Pipeline</h2>
              <Link
                href="/"
                className="flex items-center gap-1 text-sm font-medium text-[var(--board-bg)] hover:underline"
              >
                Open board <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <PipelineFunnel stages={funnelStages} lost={lostStage} />

            <div className="mt-3 flex flex-col gap-1 text-sm">
              {noNextStep > 0 && (
                <p className="text-slate-600">
                  <span className="font-medium text-slate-900">
                    {noNextStep}
                  </span>{" "}
                  open {noNextStep === 1 ? "deal has" : "deals have"} no next
                  step.
                </p>
              )}
              <Link
                href="/contacts?view=contacts"
                className="text-slate-600 hover:underline"
              >
                <span className="font-medium text-slate-900">
                  {contactCount.toLocaleString()}
                </span>{" "}
                {contactCount === 1 ? "contact" : "contacts"} not yet in the
                pipeline
              </Link>
            </div>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-900">
              Recent activity
            </h2>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              {recent.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nothing logged yet. Calls, emails and notes show up here.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {recent.map((item) => {
                    const meta = activityMeta(item.type);
                    const outcome = outcomeMeta(item.outcome);
                    const Icon = meta.icon;

                    return (
                      <li key={item.id} className="flex gap-3">
                        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                          <Icon className="size-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-slate-900">
                            <span className="font-medium">
                              {item.leadName}
                            </span>{" "}
                            <span className="text-slate-500">
                              {meta.label.toLowerCase()}
                              {outcome ? ` · ${outcome.label}` : ""}
                            </span>
                          </p>
                          {item.body && (
                            <p className="truncate text-sm text-slate-600">
                              {item.body}
                            </p>
                          )}
                          <p className="text-xs text-slate-400">
                            {formatDistanceToNow(item.createdAt, {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
