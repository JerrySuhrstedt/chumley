import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight } from "lucide-react";
import { db } from "@/db";
import { activities, leads, templates } from "@/db/schema";
import { getCurrentOrg } from "@/lib/org";
import { activityMeta, outcomeMeta } from "../_leads/activity-meta";
import { CONTACT_STAGE } from "../_leads/stages";
import { getStages } from "@/lib/stages";
import {
  DueCount,
  LocalHeading,
  OverdueBadge,
} from "./local-heading";
import { NextSteps } from "./next-steps";
import { PipelineExplorer } from "./pipeline-explorer";

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

  // Deliberately no server-side "today". This process runs in UTC and has
  // no idea what day it is where the reader is, so anything date-sensitive
  // is decided in the browser.
  const withNextStep = (l: { nextActionText: string | null }) =>
    Boolean(l.nextActionText);

  const pipeline = allLeads.filter((l) => l.stage !== CONTACT_STAGE);
  const open = pipeline.filter((l) => l.stage !== "won" && l.stage !== "lost");

  const openValue = open.reduce((sum, l) => sum + Number(l.value ?? 0), 0);
  const closedValue = pipeline
    .filter((l) => l.stage === "won")
    .reduce((sum, l) => sum + Number(l.value ?? 0), 0);

  const scheduled = pipeline.filter(
    (l) => withNextStep(l) && l.nextActionDue
  );

  const noNextStep = open.filter((l) => !l.nextActionText).length;
  const contactCount = allLeads.filter(
    (l) => l.stage === CONTACT_STAGE
  ).length;

  const stats = [
    { label: "Deals working", value: open.length.toLocaleString() },
    { label: "Money in play", value: money(openValue) },
    { label: "Money won", value: money(closedValue) },
    { label: "Due today", value: <DueCount leads={scheduled} /> },
  ];

  // The team's own buckets, in their own order, so a renamed or added
  // column appears in the funnel without the dashboard knowing about it.
  const boardStages = (await getStages(current.org.id)).filter(
    (s) => s.kind !== "contact"
  );

  const byStage = boardStages.map((stage) => {
    const rows = pipeline.filter((l) => l.stage === stage.key);
    return {
      value: stage.key,
      label: stage.label,
      color: stage.color,
      count: rows.length,
      amount: rows.reduce((sum, l) => sum + Number(l.value ?? 0), 0),
    };
  });

  // Lost is an exit, not a rung, so it sits beside the funnel rather than in it.
  const lostKey = boardStages.find((s) => s.kind === "lost")?.key;
  const funnelStages = byStage.filter((s) => s.value !== lostKey);
  const lostStage = byStage.find((s) => s.value === lostKey);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
      {/* Was capped at 5xl, which left a column of dead space on a wide
          screen while the funnel was squeezed into a fraction of what was
          left. */}
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <LocalHeading />

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
              <OverdueBadge leads={scheduled} />
            </h2>
          </div>
          <NextSteps leads={scheduled} templates={allTemplates} />
        </section>

        {/* The funnel takes the full width, with the bucket you clicked
            beside it. Recent activity sits underneath: it is a list of
            short lines, and it was only ever alongside because there was
            room, not because the two belong together. */}
        <div className="flex flex-col gap-6">
          <section>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="font-semibold text-slate-900">Pipeline</h2>
              <Link
                href="/pipeline"
                className="flex items-center gap-1 text-sm font-medium text-[var(--board-bg)] hover:underline"
              >
                Open the board <ArrowRight className="size-3.5" />
              </Link>
            </div>

            {lostStage && (
              <PipelineExplorer
                stages={funnelStages}
                lost={lostStage}
                leads={pipeline}
              />
            )}

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
