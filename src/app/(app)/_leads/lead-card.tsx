"use client";

import type { HTMLAttributes } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight } from "lucide-react";
import type { Lead, Template } from "@/db/schema";
import { LeadAvatar } from "./lead-avatar";
import { TapToContact } from "./tap-to-contact";
import { nextActionStatus, nextStage, STAGES } from "./stages";
import { temperature } from "./temperature";
import type { LeadStage } from "./actions";

/**
 * Presentational card. Rendered both in a column and inside the DragOverlay,
 * so it takes no drag state of its own.
 */
export function LeadCardView({
  lead,
  templates,
  onClick,
  onMoveNext,
  onContact,
  dragHandleProps,
  overlay = false,
}: {
  lead: Lead;
  templates: Template[];
  onClick?: () => void;
  onMoveNext?: (stage: LeadStage) => void;
  onContact?: (type: "call" | "text" | "email") => void;
  dragHandleProps?: HTMLAttributes<HTMLDivElement>;
  overlay?: boolean;
}) {
  const status = nextActionStatus(lead);
  const upcoming = nextStage(lead.stage);
  const upcomingLabel = upcoming
    ? STAGES.find((s) => s.value === upcoming)?.label
    : null;

  const temp = temperature(lead.temperature);

  const meta = [lead.companyName, lead.value ? `$${lead.value}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={`rounded-lg bg-white transition-shadow ${
        overlay
          ? "rotate-3 cursor-grabbing shadow-[0_8px_16px_rgba(9,30,66,0.35)]"
          : "shadow-[0_1px_1px_rgba(9,30,66,0.25)] hover:shadow-[0_2px_4px_rgba(9,30,66,0.25)]"
      }`}
    >
      <div
        {...dragHandleProps}
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

        <div className="flex items-center gap-2">
          <LeadAvatar lead={lead} className="size-7 text-[11px]" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--board-ink)]">
              {lead.name}
            </p>
            {meta && (
              <p className="truncate text-xs text-[var(--board-ink-muted)]">
                {meta}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1 px-3 pb-2.5">
        <div className="flex items-center justify-between gap-2">
          <TapToContact
            lead={lead}
            templates={templates}
            stopPropagation
            onContact={onContact}
          />

          {/* Scannable across the whole board, which is the point of
              rating a lead in the first place. */}
          {temp && (
            <span
              title={temp.label}
              aria-label={temp.label}
              className="flex size-7 shrink-0 items-center justify-center rounded-md"
              style={{ backgroundColor: temp.bg }}
            >
              <temp.icon className="size-4 text-white" strokeWidth={2.4} />
            </span>
          )}
        </div>

        {upcoming && upcomingLabel && onMoveNext && (
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

/**
 * Sortable wrapper. Cards other than the dragged one shift to open a gap as
 * the pointer moves over them; the dragged card leaves a faded placeholder
 * while DragOverlay renders the travelling copy above the board.
 */
export function LeadCard({
  lead,
  templates,
  onClick,
  onMoveNext,
  onContact,
}: {
  lead: Lead;
  templates: Template[];
  onClick: () => void;
  onMoveNext: (stage: LeadStage) => void;
  onContact: (type: "call" | "text" | "email") => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      // While the card travels in the DragOverlay, the space it came from
      // holds open as a dashed outline rather than a faded copy, so it reads
      // as "this is where it lands" instead of "this is broken".
      // Outline rather than border, because an outline costs no layout and
      // the gap must not resize as the card leaves it.
      className={
        isDragging
          ? "rounded-lg bg-black/[0.04] outline-2 -outline-offset-2 outline-dashed outline-[rgba(9,30,66,0.3)]"
          : undefined
      }
    >
      <div className={isDragging ? "invisible" : undefined}>
        <LeadCardView
          lead={lead}
          templates={templates}
          onClick={onClick}
          onMoveNext={onMoveNext}
          onContact={onContact}
          dragHandleProps={{ ...listeners, ...attributes }}
        />
      </div>
    </div>
  );
}
