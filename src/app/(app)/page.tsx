import { eq } from "drizzle-orm";
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
    db.query.leads.findMany({
      where: eq(leads.orgId, current.org.id),
      with: { activities: true },
    }),
    db.select().from(templates).where(eq(templates.orgId, current.org.id)),
  ]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1">
          <Scorecard leads={allLeads} />
        </div>
        <QuickAddLeadDialog />
      </div>

      <LeadsBoard leads={allLeads} templates={allTemplates} />
    </div>
  );
}
