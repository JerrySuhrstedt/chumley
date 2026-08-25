"use client";

import type { HTMLAttributes } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MoveRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Lead, Template } from "@/db/schema";
import { LeadAvatar } from "./lead-avatar";
import { TapToContact } from "./tap-to-contact";
import { nextActionStatus } from "./stages";
import { useBoardStages } from "./stages-context";
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
  onMove,
  onContact,
  dragHandleProps,
  overlay = false,
}: {
  lead: Lead;
  templates: Template[];
  onClick?: () => void;
  onMove?: (stage: LeadStage) => void;
  onContact?: (type: "call" | "text" | "email") => void;
  dragHandleProps?: HTMLAttributes<HTMLDivElement>;
  overlay?: boolean;
}) {
  const boardStages = useBoardStages();
  const status = nextActionStatus(lead);
  // Everywhere this deal is not, so the menu never offers where it is.
  const elsewhere = boardStages.filter((s) => s.key !== lead.stage);

  const temp = temperature(lead.temperature);

  /**
   * The deal size, as money rather than a raw column value.
   *
   * It used to be joined onto the company name in grey, which put the one
   * number the job is measured on in the least prominent place on the
   * card. Cents are dropped: nobody scans a board for 45,000.00.
   */
  const amount =
    lead.value !== null && lead.value !== undefined && lead.value !== ""
      ? Number(lead.value)
      : null;
  const money =
    amount !== null && Number.isFinite(amount)
      ? `$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
      : null;

  return (
    <div
      /* The coach marks find the seeded cards through this rather than
         through a stage or a position, because neither is guaranteed:
         samples can be dragged anywhere before the tour is ever seen. */
      data-coach={lead.isSample ? "sample-lead" : undefined}
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
        {/* The next step and the money share the top line: what to do, and
            what it is worth. The amount is right-aligned and coloured
            because being different from everything around it is what
            draws the eye to it. */}
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span
              className="inline-flex min-w-0 items-center truncate rounded px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: status.color,
                color: status.key === "today" ? "#172b4d" : "#fff",
              }}
              title={status.label}
            >
              {status.label}
            </span>

            {lead.isSample && (
              <span className="inline-flex shrink-0 items-center rounded bg-[var(--board-ink-muted)] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                Example
              </span>
            )}
          </div>

          {money && (
            <span className="shrink-0 text-lg leading-tight font-semibold text-[var(--brand)]">
              {money}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <LeadAvatar lead={lead} className="size-7 text-[11px]" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--board-ink)]">
              {lead.name}
            </p>
            {lead.companyName && (
              <p className="truncate text-xs text-[var(--board-ink-muted)]">
                {lead.companyName}
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

        {/* Dragging is fine with a mouse and miserable with a thumb, so on
            a phone every bucket is one tap away, in any direction. */}
        {onMove && (
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-between rounded px-1 py-1.5 text-xs font-medium text-[var(--board-ink-muted)] transition-colors hover:bg-[var(--board-column-hover)] md:hidden"
            >
              Move to...
              <MoveRight className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-44">
              {elsewhere.map((s) => (
                <DropdownMenuItem
                  key={s.key}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMove(s.key);
                  }}
                >
                  <span
                    className="mr-2 size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  {s.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
  onMove,
  onContact,
}: {
  lead: Lead;
  templates: Template[];
  onClick: () => void;
  onMove: (stage: LeadStage) => void;
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
          onMove={onMove}
          onContact={onContact}
          dragHandleProps={{ ...listeners, ...attributes }}
        />
      </div>
    </div>
  );
}
