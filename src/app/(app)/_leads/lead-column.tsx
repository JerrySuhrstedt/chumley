"use client";

import { useDroppable } from "@dnd-kit/core";
import type { Lead, Template } from "@/db/schema";
import type { LeadStage } from "./actions";
import { LeadCard } from "./lead-card";

export function LeadColumn({
  stage,
  label,
  leads,
  templates,
  onCardClick,
  onMoveNext,
}: {
  stage: LeadStage;
  label: string;
  leads: Lead[];
  templates: Template[];
  onCardClick: (leadId: string) => void;
  onMoveNext: (leadId: string, stage: LeadStage) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  const total = leads.reduce((sum, l) => sum + Number(l.value ?? 0), 0);

  return (
    <div className="flex w-full shrink-0 flex-col gap-3 md:w-64">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-medium">{label}</h2>
        <span className="text-xs text-muted-foreground">
          {leads.length}
          {total > 0 ? ` · $${total.toLocaleString()}` : ""}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-24 flex-1 flex-col gap-2 rounded-lg border border-dashed p-2 transition-colors ${
          isOver ? "border-primary bg-primary/5" : "border-transparent"
        }`}
      >
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            templates={templates}
            onClick={() => onCardClick(lead.id)}
            onMoveNext={(next) => onMoveNext(lead.id, next)}
          />
        ))}
      </div>
    </div>
  );
}
