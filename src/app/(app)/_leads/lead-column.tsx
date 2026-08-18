"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Lead, Template } from "@/db/schema";
import type { LeadStage } from "./actions";
import { BucketName } from "./bucket-name";
import { LeadCard } from "./lead-card";
import { QuickAddLeadDialog } from "./quick-add-lead-dialog";

/**
 * The two outcome buckets carry a tint so a closed deal is obvious at a
 * glance. Everything still in play stays neutral.
 */
const BUCKET_TINT: Partial<Record<LeadStage, { base: string; over: string }>> = {
  won: { base: "var(--bucket-won)", over: "var(--bucket-won-hover)" },
  lost: { base: "var(--bucket-lost)", over: "var(--bucket-lost-hover)" },
};

export function LeadColumn({
  stage,
  label,
  leads,
  templates,
  isDropTarget = false,
  onCardClick,
  onMoveNext,
  onContact,
}: {
  stage: LeadStage;
  label: string;
  leads: Lead[];
  templates: Template[];
  isDropTarget?: boolean;
  onCardClick: (leadId: string) => void;
  onMoveNext: (leadId: string, stage: LeadStage) => void;
  onContact: (leadId: string, type: "call" | "text" | "email") => void;
}) {
  const { setNodeRef } = useDroppable({ id: stage });

  const tint = BUCKET_TINT[stage];
  const total = leads.reduce((sum, l) => sum + Number(l.value ?? 0), 0);

  return (
    <div
      ref={setNodeRef}
      style={{
        backgroundColor: tint
          ? isDropTarget
            ? tint.over
            : tint.base
          : undefined,
      }}
      className={`flex max-h-full w-full flex-col rounded-xl transition-all md:w-72 ${
        isDropTarget
          ? // Solid ring hugs the whole edge; the blurred pass adds the glow.
            "shadow-[0_0_0_3px_var(--drop-glow),0_0_16px_4px_var(--drop-glow-soft)]"
          : ""
      } ${
        tint
          ? ""
          : isDropTarget
            ? "bg-[var(--board-column-hover)]"
            : "bg-[var(--board-column)]"
      }`}
    >
      <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
        <h2 className="min-w-0 flex-1">
          <BucketName stage={stage} label={label} />
        </h2>
        <span className="shrink-0 text-xs text-[var(--board-ink-muted)]">
          {leads.length}
          {total > 0 ? ` · $${total.toLocaleString()}` : ""}
        </span>
      </div>

      <div className="flex min-h-12 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-1">
        <SortableContext
          items={leads.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              templates={templates}
              onClick={() => onCardClick(lead.id)}
              onMoveNext={(next) => onMoveNext(lead.id, next)}
              onContact={(type) => onContact(lead.id, type)}
            />
          ))}
        </SortableContext>

        {leads.length === 0 && isDropTarget && (
          <div className="m-1 flex-1 rounded-lg border-2 border-dashed border-[var(--drop-glow)]" />
        )}
      </div>

      <div className="p-2 pt-1">
        <QuickAddLeadDialog stage={stage} variant="inline" />
      </div>
    </div>
  );
}
