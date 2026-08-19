import Link from "next/link";
import { and, count, eq, ilike, ne, or } from "drizzle-orm";
import { Search } from "lucide-react";
import { db } from "@/db";
import { leads, templates } from "@/db/schema";
import { getCurrentOrg } from "@/lib/org";
import { QuickAddLeadDialog } from "../_leads/quick-add-lead-dialog";
import { ContactsList } from "./contacts-list";

export default async function ContactsPage({
  searchParams,
}: PageProps<"/contacts">) {
  const current = await getCurrentOrg();
  if (!current) return null;

  const { q, view, open } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const filter = view === "pipeline" || view === "contacts" ? view : "all";

  const search = query
    ? or(
        ilike(leads.name, `%${query}%`),
        ilike(leads.companyName, `%${query}%`),
        ilike(leads.email, `%${query}%`),
        ilike(leads.phone, `%${query}%`)
      )
    : undefined;

  const stageFilter =
    filter === "pipeline"
      ? ne(leads.stage, "contact")
      : filter === "contacts"
        ? eq(leads.stage, "contact")
        : undefined;

  const [rows, counts, allTemplates] = await Promise.all([
    db.query.leads.findMany({
      where: and(eq(leads.orgId, current.org.id), search, stageFilter),
      with: { activities: true },
      orderBy: (l, { asc }) => [asc(l.name)],
    }),
    db
      .select({ stage: leads.stage, count: count() })
      .from(leads)
      .where(eq(leads.orgId, current.org.id))
      .groupBy(leads.stage),
    db.select().from(templates).where(eq(templates.orgId, current.org.id)),
  ]);

  const total = counts.reduce((sum, row) => sum + Number(row.count), 0);
  const offPipeline = Number(
    counts.find((row) => row.stage === "contact")?.count ?? 0
  );

  const TABS = [
    { key: "all", label: "All", count: total },
    { key: "pipeline", label: "In pipeline", count: total - offPipeline },
    { key: "contacts", label: "Not in pipeline", count: offPipeline },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Contacts</h1>
            <p className="text-sm text-slate-500">
              Everyone you know. Move someone to the board when they show interest.
            </p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
          <form className="relative w-full sm:w-72">
            {filter !== "all" && (
              <input type="hidden" name="view" value={filter} />
            )}
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Search name, company, phone..."
              className="h-10 w-full rounded-md border border-slate-300 bg-white pr-3 pl-8 text-sm outline-none focus:border-[var(--board-bg)] focus:ring-3 focus:ring-[var(--board-bg)]/20"
            />
          </form>
          {/* Lands off the board, since a contact has not shown interest yet. */}
          <QuickAddLeadDialog stage="contact" variant="contact" />
          </div>
        </div>

        <div className="mb-4 flex gap-1.5">
          {TABS.map((tab) => {
            const params = new URLSearchParams();
            if (tab.key !== "all") params.set("view", tab.key);
            if (query) params.set("q", query);
            const href = params.toString()
              ? `/contacts?${params}`
              : "/contacts";

            return (
              <Link
                key={tab.key}
                href={href}
                className={
                  filter === tab.key
                    ? "rounded-full bg-[var(--board-bg)] px-3 py-1.5 text-xs font-medium text-white"
                    : "rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
                }
              >
                {tab.label} ({tab.count.toLocaleString()})
              </Link>
            );
          })}
        </div>

        <ContactsList
          leads={rows}
          templates={allTemplates}
          query={query}
          openId={typeof open === "string" ? open : undefined}
        />
      </div>
    </div>
  );
}
