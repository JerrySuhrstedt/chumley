import { and, eq, ilike, or } from "drizzle-orm";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { db } from "@/db";
import { leads, templates } from "@/db/schema";
import { getCurrentOrg } from "@/lib/org";
import { TapToContact } from "../_leads/tap-to-contact";
import { STAGES } from "../_leads/stages";

export default async function ContactsPage({
  searchParams,
}: PageProps<"/contacts">) {
  const current = await getCurrentOrg();
  if (!current) return null;

  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  const [rows, allTemplates] = await Promise.all([
    db
      .select()
      .from(leads)
      .where(
        query
          ? and(
              eq(leads.orgId, current.org.id),
              or(
                ilike(leads.name, `%${query}%`),
                ilike(leads.companyName, `%${query}%`),
                ilike(leads.email, `%${query}%`),
                ilike(leads.phone, `%${query}%`)
              )
            )
          : eq(leads.orgId, current.org.id)
      )
      .orderBy(leads.name),
    db.select().from(templates).where(eq(templates.orgId, current.org.id)),
  ]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Contacts</h1>
            <p className="text-sm text-slate-500">
              Everyone in your pipeline, in one list.
            </p>
          </div>
          <form className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Search name, company, phone..."
              className="h-10 w-full rounded-md border border-slate-300 bg-white pr-3 pl-8 text-sm outline-none focus:border-[var(--board-bg)] focus:ring-3 focus:ring-[var(--board-bg)]/20"
            />
          </form>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              {query ? "No contacts match that search." : "No contacts yet."}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {rows.map((lead) => {
                const stage = STAGES.find((s) => s.value === lead.stage);
                return (
                  <li
                    key={lead.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900">
                          {lead.name}
                        </p>
                        {stage && (
                          <Badge variant="secondary">{stage.label}</Badge>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-sm text-slate-500">
                        {[lead.companyName, lead.email, lead.phone]
                          .filter(Boolean)
                          .join(" · ") || "No contact details yet"}
                      </p>
                      {lead.nextActionText && (
                        <p className="mt-1 text-xs text-slate-500">
                          Next: {lead.nextActionText}
                          {lead.nextActionDue ? ` (${lead.nextActionDue})` : ""}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0">
                      <TapToContact lead={lead} templates={allTemplates} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
