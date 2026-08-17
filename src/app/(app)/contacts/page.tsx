import { and, eq, ilike, or } from "drizzle-orm";
import { Search } from "lucide-react";
import { db } from "@/db";
import { leads, templates } from "@/db/schema";
import { getCurrentOrg } from "@/lib/org";
import { ContactsList } from "./contacts-list";

export default async function ContactsPage({
  searchParams,
}: PageProps<"/contacts">) {
  const current = await getCurrentOrg();
  if (!current) return null;

  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  const [rows, allTemplates] = await Promise.all([
    db.query.leads.findMany({
      where: query
        ? and(
            eq(leads.orgId, current.org.id),
            or(
              ilike(leads.name, `%${query}%`),
              ilike(leads.companyName, `%${query}%`),
              ilike(leads.email, `%${query}%`),
              ilike(leads.phone, `%${query}%`)
            )
          )
        : eq(leads.orgId, current.org.id),
      with: { activities: true },
      orderBy: (l, { asc }) => [asc(l.name)],
    }),
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

        <ContactsList
          leads={rows}
          templates={allTemplates}
          query={query}
        />
      </div>
    </div>
  );
}
