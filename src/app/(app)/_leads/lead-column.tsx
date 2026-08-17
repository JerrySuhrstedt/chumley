"use client";

import { useDroppable } from "@dnd-kit/core";
import type { Lead, Template } from "@/db/schema";
import type { LeadStage } from "./actions";
import { LeadCard } from "./lead-card";
import { QuickAddLeadDialog } from "./quick-add-lead-dialog";

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
    <div
      className={`flex max-h-full w-full flex-col rounded-xl bg-[var(--board-column)] transition-colors md:w-72 ${
        isOver ? "ring-2 ring-white/70" : ""
      }`}
    >
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <h2 className="text-sm font-semibold text-[var(--board-ink)]">
          {label}
        </h2>
        <span className="text-xs text-[var(--board-ink-muted)]">
          {leads.length}
          {total > 0 ? ` · $${total.toLocaleString()}` : ""}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className="flex min-h-12 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-1"
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

      <div className="p-2 pt-1">
        <QuickAddLeadDialog stage={stage} variant="inline" />
      </div>
    </div>
  );
}
