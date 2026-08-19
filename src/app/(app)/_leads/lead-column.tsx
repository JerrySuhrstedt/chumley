"use client";

import { useTransition } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripHorizontal, MoreHorizontal, PartyPopper, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Lead, Template } from "@/db/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LeadStage } from "./actions";
import { BucketHint } from "./bucket-hint";
import { BucketName } from "./bucket-name";
import { deleteStage } from "./stage-actions";
import { nextStage, type BoardStage } from "./stages";
import { useBoardStages } from "./stages-context";
import { LeadCard } from "./lead-card";
import { SwipeableCard } from "./swipeable-card";
import { QuickAddLeadDialog } from "./quick-add-lead-dialog";

/**
 * The two outcome buckets carry a tint so a closed deal is obvious at a
 * glance. Everything still in play stays neutral.
 */
const BUCKET_TINT: Record<string, { base: string; over: string }> = {
  won: { base: "var(--bucket-won)", over: "var(--bucket-won-hover)" },
  lost: { base: "var(--bucket-lost)", over: "var(--bucket-lost-hover)" },
};

export function LeadColumn({
  stage,
  leads,
  templates,
  isDropTarget = false,
  onCardClick,
  onMove,
  onSwipeForward,
  onSwipeArchive,
  onContact,
}: {
  stage: BoardStage;
  leads: Lead[];
  templates: Template[];
  isDropTarget?: boolean;
  onCardClick: (leadId: string) => void;
  onMove: (leadId: string, stage: LeadStage) => void;
  onSwipeForward: (leadId: string) => void;
  onSwipeArchive: (leadId: string) => void;
  onContact: (leadId: string, type: "call" | "text" | "email") => void;
}) {
  const boardStages = useBoardStages();
  const [, startTransition] = useTransition();

  // Cards drop into the column by its key; the column itself sorts by its
  // row id. Two different ids on purpose, so a card being dragged is never
  // mistaken for the column being dragged.
  const { setNodeRef: setDropRef } = useDroppable({ id: stage.key });

  const movable = stage.kind === "open";
  const {
    attributes,
    listeners,
    setNodeRef: setSortRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id, disabled: !movable });

  const tint = BUCKET_TINT[stage.kind];
  const total = leads.reduce((sum, l) => sum + Number(l.value ?? 0), 0);

  function remove() {
    startTransition(async () => {
      const result = await deleteStage(stage.id);
      if (result.error) {
        toast.error(result.error);
      } else if (result.movedTo) {
        toast.success(`"${stage.label}" removed. Its deals moved to ${result.movedTo}.`);
      }
    });
  }

  return (
    <div
      ref={setSortRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        // The column being dragged is represented by the overlay, so the
        // original fades rather than leaving a solid duplicate behind.
        opacity: isDragging ? 0.4 : undefined,
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
      {/* The handle sits above the name, full width, so it reads as
          "this whole column moves" rather than as a button. */}
      {movable && (
        <div
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${stage.label}`}
          className="flex cursor-grab touch-none justify-center pt-1.5 text-[var(--board-ink-muted)] opacity-50 transition-opacity hover:opacity-100 active:cursor-grabbing"
        >
          <GripHorizontal className="size-4" />
        </div>
      )}

      <div
        className={`flex items-center justify-between gap-2 px-3 pb-2 ${movable ? "pt-1" : "pt-3"}`}
      >
        <h2 className="flex min-w-0 flex-1 items-center gap-1.5">
          <BucketName stageId={stage.id} label={stage.label} />

          {/* Tied to the key, not the label, so both survive a rename. */}
          {stage.key === "new_lead" && (
            <BucketHint title="How someone gets here">
              Everyone you know sits in Contacts. When one of them shows real
              interest, a reply, a question about price, a booked meeting,
              they earn a spot on the board. That is when they become a lead
              and you start working the deal.
            </BucketHint>
          )}

          {stage.kind === "won" && (
            <PartyPopper
              className="size-[1.6rem] shrink-0 text-[#0ca30c]"
              aria-label="Win"
            />
          )}
        </h2>

        <span className="shrink-0 text-xs text-[var(--board-ink-muted)]">
          {leads.length}
          {total > 0 ? ` · $${total.toLocaleString()}` : ""}
        </span>

        {movable && (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={`${stage.label} options`}
              className="shrink-0 rounded p-0.5 text-[var(--board-ink-muted)] opacity-60 hover:bg-black/5 hover:opacity-100"
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={remove} variant="destructive">
                <Trash2 className="size-4" />
                Delete bucket
                {leads.length > 0 && (
                  <span className="ml-1 text-xs opacity-70">
                    ({leads.length} move left)
                  </span>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div
        ref={setDropRef}
        className="flex min-h-12 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-1"
      >
        <SortableContext
          items={leads.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {leads.map((lead) => (
            <SwipeableCard
              key={lead.id}
              forward={nextStage(lead.stage, boardStages)}
              onForward={() => onSwipeForward(lead.id)}
              onArchive={() => onSwipeArchive(lead.id)}
            >
              <LeadCard
                lead={lead}
                templates={templates}
                onClick={() => onCardClick(lead.id)}
                onMove={(next: LeadStage) => onMove(lead.id, next)}
                onContact={(type) => onContact(lead.id, type)}
              />
            </SwipeableCard>
          ))}
        </SortableContext>

        {leads.length === 0 && isDropTarget && (
          <div className="m-1 flex-1 rounded-lg border-2 border-dashed border-[var(--drop-glow)]" />
        )}
      </div>

      <div className="p-2 pt-1">
        <QuickAddLeadDialog stage={stage.key} variant="inline" />
      </div>
    </div>
  );
}
