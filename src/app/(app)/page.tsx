import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { leads, templates } from "@/db/schema";
import { getCurrentOrg } from "@/lib/org";
import { LeadsBoard } from "./_leads/leads-board";
import { QuickAddLeadDialog } from "./_leads/quick-add-lead-dialog";
import { Scorecard } from "./_leads/scorecard";

export default async function PipelinePage() {
  const current = await getCurrentOrg();
  if (!current) return null;

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

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-col gap-3 px-4 pt-4 md:flex-row md:items-center md:justify-between md:px-6">
        <Scorecard leads={allLeads} />
        <div className="md:shrink-0">
          <QuickAddLeadDialog />
        </div>
      </div>

      <LeadsBoard leads={allLeads} templates={allTemplates} />
    </div>
  );
}
