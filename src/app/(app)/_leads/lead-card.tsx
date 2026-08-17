"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight } from "lucide-react";
import type { Lead, Template } from "@/db/schema";
import { TapToContact } from "./tap-to-contact";
import { nextActionStatus, nextStage, STAGES } from "./stages";
import type { LeadStage } from "./actions";

export function LeadCard({
  lead,
  templates,
  onClick,
  onMoveNext,
}: {
  lead: Lead;
  templates: Template[];
  onClick: () => void;
  onMoveNext: (stage: LeadStage) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: lead.id });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const status = nextActionStatus(lead);
  const upcoming = nextStage(lead.stage);
  const upcomingLabel = upcoming
    ? STAGES.find((s) => s.value === upcoming)?.label
    : null;

  const meta = [lead.companyName, lead.value ? `$${lead.value}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg bg-white shadow-[0_1px_1px_rgba(9,30,66,0.25)] transition-shadow hover:shadow-[0_2px_4px_rgba(9,30,66,0.25)] ${
        isDragging ? "rotate-2 opacity-60" : ""
      }`}
    >
      <div
        {...listeners}
        {...attributes}
        onClick={onClick}
        className="cursor-pointer px-3 pt-2.5 pb-2"
      >
        <span
          className="mb-2 inline-flex max-w-full items-center truncate rounded px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: status.color,
            color: status.key === "today" ? "#172b4d" : "#fff",
          }}
          title={status.label}
        >
          {status.label}
        </span>

        <p className="text-sm font-medium text-[var(--board-ink)]">
          {lead.name}
        </p>
        {meta && (
          <p className="mt-0.5 text-xs text-[var(--board-ink-muted)]">{meta}</p>
        )}
      </div>

      <div className="flex flex-col gap-1 px-3 pb-2.5">
        <TapToContact lead={lead} templates={templates} stopPropagation />

        {upcoming && upcomingLabel && (
          <button
            type="button"
            className="flex items-center justify-between rounded px-1 py-1.5 text-xs font-medium text-[var(--board-ink-muted)] transition-colors hover:bg-[var(--board-column-hover)] md:hidden"
            onClick={(e) => {
              e.stopPropagation();
              onMoveNext(upcoming);
            }}
          >
            Move to {upcomingLabel}
            <ChevronRight className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
