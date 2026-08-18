"use client";

import { useState } from "react";
import { CalendarClock } from "lucide-react";
import type { Activity, Lead, Template } from "@/db/schema";
import { LeadAvatar } from "../_leads/lead-avatar";
import { LeadDetailDialog } from "../_leads/lead-detail-dialog";
import { cn } from "@/lib/utils";

type LeadWithActivities = Lead & { activities: Activity[] };

/** Overdue and due-today next steps, opening the record straight from the row. */
export function NextSteps({
  leads,
  templates,
  today,
}: {
  leads: LeadWithActivities[];
  templates: Template[];
  today: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = leads.find((l) => l.id === selectedId) ?? null;

  if (leads.length === 0) {
    return (
      <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Nothing due. Every lead with a next step is scheduled ahead.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <ul className="divide-y divide-slate-100">
          {leads.map((lead) => {
            const overdue = !!lead.nextActionDue && lead.nextActionDue < today;

            return (
              <li key={lead.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(lead.id)}
                  className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-slate-50"
                >
                  <LeadAvatar lead={lead} className="size-9 text-sm" />

                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-900">
                      {lead.nextActionText}
                    </span>
                    <span className="block truncate text-sm text-slate-500">
                      {lead.name}
                      {lead.companyName ? ` · ${lead.companyName}` : ""}
                    </span>
                  </span>

                  <span
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                      overdue
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-800"
                    )}
                  >
                    <CalendarClock className="size-3.5" />
                    {overdue ? "Overdue" : "Today"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {selected && (
        <LeadDetailDialog
          lead={selected}
          templates={templates}
          open={!!selectedId}
          onOpenChange={(open) => !open && setSelectedId(null)}
        />
      )}
    </>
  );
}
