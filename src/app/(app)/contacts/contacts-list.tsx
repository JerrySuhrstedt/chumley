"use client";

import { useEffect, useState } from "react";
import { ArrowRightCircle, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Activity, Lead, Template } from "@/db/schema";
import { addToPipeline, type ActivityType } from "../_leads/actions";
import { LeadAvatar } from "../_leads/lead-avatar";
import { LeadDetailDialog } from "../_leads/lead-detail-dialog";
import { ALL_STAGES, CONTACT_STAGE } from "../_leads/stages";
import { TapToContact } from "../_leads/tap-to-contact";
import { lastTouched, type SortKey } from "./sort";

type LeadWithActivities = Lead & { activities: Activity[] };

export function ContactsList({
  leads,
  templates,
  query,
  openId,
  sortKey = "last",
}: {
  leads: LeadWithActivities[];
  templates: Template[];
  query: string;
  sortKey?: SortKey;
  /** Set by header search, so a result opens its record on arrival. */
  openId?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(openId ?? null);
  const [logType, setLogType] = useState<ActivityType>("note");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- follow the record named in the URL
    setSelectedId(openId ?? null);
  }, [openId]);

  const selected = leads.find((l) => l.id === selectedId) ?? null;

  /** Reaching out opens the record with the log ready for that channel. */
  function handleContact(leadId: string, type: ActivityType) {
    setLogType(type);
    setSelectedId(leadId);
  }

  function openRecord(leadId: string) {
    setLogType("note");
    setSelectedId(leadId);
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {leads.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            {query ? "No contacts match that search." : "No contacts yet."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {leads.map((lead) => {
              const stage = ALL_STAGES.find((s) => s.value === lead.stage);
              const details =
                [lead.companyName, lead.email, lead.phone]
                  .filter(Boolean)
                  .join(" · ") || "No contact details yet";

              const touched = lastTouched(lead);
              const dateNote =
                sortKey === "newest"
                  ? `Added ${new Date(lead.createdAt).toLocaleDateString()}`
                  : sortKey === "changed"
                    ? `Changed ${new Date(lead.updatedAt).toLocaleDateString()}`
                  : sortKey === "recent" || sortKey === "cold"
                    ? touched
                      ? `Last talked ${new Date(touched).toLocaleDateString()}`
                      : "Never talked to"
                    : null;

              return (
                <li
                  key={lead.id}
                  className="flex flex-col gap-3 p-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <button
                    type="button"
                    onClick={() => openRecord(lead.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <LeadAvatar lead={lead} className="size-9 text-sm" />

                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-900">
                          {lead.name}
                        </span>
                        {stage && (
                          <Badge variant="secondary">{stage.label}</Badge>
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-slate-500">
                        {dateNote && (
                          <span className="text-slate-400">
                            {dateNote}
                            {" · "}
                          </span>
                        )}
                        {details}
                      </span>
                      {lead.nextActionText && (
                        <span className="mt-1 block text-xs text-slate-500">
                          Next: {lead.nextActionText}
                          {lead.nextActionDue
                            ? ` (${lead.nextActionDue})`
                            : ""}
                        </span>
                      )}
                    </span>
                  </button>

                  <div className="flex shrink-0 items-center gap-2">
                    {lead.stage === CONTACT_STAGE && (
                      <form
                        action={async () => {
                          await addToPipeline(lead.id);
                        }}
                      >
                        <Button type="submit" size="sm" variant="outline">
                          <ArrowRightCircle className="size-4" />
                          Add to pipeline
                        </Button>
                      </form>
                    )}
                    <TapToContact
                      lead={lead}
                      templates={templates}
                      stopPropagation
                      onContact={(type) => handleContact(lead.id, type)}
                    />
                    <button
                      type="button"
                      onClick={() => openRecord(lead.id)}
                      aria-label={`Open ${lead.name}`}
                      className="hidden rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 sm:block"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {selected && (
        <LeadDetailDialog
          lead={selected}
          templates={templates}
          initialLogType={logType}
          open={!!selectedId}
          onOpenChange={(open) => !open && setSelectedId(null)}
        />
      )}
    </>
  );
}
