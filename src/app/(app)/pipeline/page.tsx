import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { leads, templates } from "@/db/schema";
import { getCurrentOrg } from "@/lib/org";
import { EmptyBoard } from "../_leads/empty-board";
import { LeadsBoard } from "../_leads/leads-board";
import { resolveStageLabels } from "../_leads/stages";

export default async function PipelinePage() {
  const current = await getCurrentOrg();
  if (!current) return null;

  const stageLabels = resolveStageLabels(current.org.stageLabels);

  const [allLeads, allTemplates] = await Promise.all([
    // The board is the pipeline only — contacts live on the Contacts page
    // until they show interest.
    db.query.leads.findMany({
      where: and(eq(leads.orgId, current.org.id), ne(leads.stage, "contact")),
      with: { activities: true },
      orderBy: (l, { asc }) => [asc(l.position), asc(l.createdAt)],
    }),
    db.select().from(templates).where(eq(templates.orgId, current.org.id)),
  ]);

  // An empty five-column board explains nothing to somebody who just
  // signed up, so the first run gets an instruction instead.
  if (allLeads.length === 0) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <EmptyBoard />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <LeadsBoard
        leads={allLeads}
        templates={allTemplates}
        stageLabels={stageLabels}
      />
    </div>
  );
}
