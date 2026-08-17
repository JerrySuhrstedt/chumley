"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Activity, Lead, Template } from "@/db/schema";
import { type LeadStage, updateLeadStage } from "./actions";
import { LeadColumn } from "./lead-column";
import { LeadDetailDialog } from "./lead-detail-dialog";
import { STAGES } from "./stages";

type LeadWithActivities = Lead & { activities: Activity[] };

export function LeadsBoard({
  leads,
  templates,
}: {
  leads: LeadWithActivities[];
  templates: Template[];
}) {
  const [localLeads, setLocalLeads] = useState(leads);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [mobileStage, setMobileStage] = useState<LeadStage>("new_lead");
  const [, startTransition] = useTransition();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resync optimistic drag state once the server revalidates
    setLocalLeads(leads);
  }, [leads]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return localLeads;
    return localLeads.filter((lead) =>
      [lead.name, lead.companyName, lead.phone]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q))
    );
  }, [localLeads, query]);

  function moveStage(leadId: string, stage: LeadStage) {
    setLocalLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage } : l))
    );
    startTransition(async () => {
      await updateLeadStage(leadId, stage);
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const leadId = String(active.id);
    const newStage = over.id as LeadStage;
    const lead = localLeads.find((l) => l.id === leadId);
    if (!lead || lead.stage === newStage) return;

    moveStage(leadId, newStage);
  }

  const selectedLead = localLeads.find((l) => l.id === selectedId) ?? null;

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-hidden">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, company, or phone..."
          className="h-11 pl-8 text-base md:h-9 md:text-sm"
        />
      </div>

      <div className="flex gap-1 overflow-x-auto md:hidden">
        {STAGES.map((stage) => (
          <button
            key={stage.value}
            onClick={() => setMobileStage(stage.value)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
              mobileStage === stage.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {stage.label} (
            {filtered.filter((l) => l.stage === stage.value).length})
          </button>
        ))}
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <div
              key={stage.value}
              className={cn(
                stage.value === mobileStage ? "flex" : "hidden",
                "w-full md:flex md:w-64"
              )}
            >
              <LeadColumn
                stage={stage.value}
                label={stage.label}
                leads={filtered.filter((l) => l.stage === stage.value)}
                templates={templates}
                onCardClick={setSelectedId}
                onMoveNext={moveStage}
              />
            </div>
          ))}
        </div>
      </DndContext>

      {selectedLead && (
        <LeadDetailDialog
          lead={selectedLead}
          templates={templates}
          open={!!selectedId}
          onOpenChange={(open) => !open && setSelectedId(null)}
        />
      )}
    </div>
  );
}
