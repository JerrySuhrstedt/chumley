"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { fireConfetti } from "@/lib/confetti";
import {
  closestCenter,
  type CollisionDetection,
  DndContext,
  DragOverlay,
  pointerWithin,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Activity, Lead, Template } from "@/db/schema";
import {
  type ActivityType,
  type LeadStage,
  type LeadTemperature,
  reorderStage,
} from "./actions";
import { BoardFilters, matchesFilters, type DueFilter } from "./board-filters";
import { LeadCardView } from "./lead-card";
import { LeadColumn } from "./lead-column";
import { LeadDetailDialog } from "./lead-detail-dialog";
import { QuickAddLeadDialog } from "./quick-add-lead-dialog";
import { SampleBanner } from "./sample-banner";
import { Scorecard } from "./scorecard";
import { nextStage, prevStage } from "./stages";
import { useBoardStages } from "./stages-context";
import { AddStageButton } from "./add-stage";
import { reorderStages } from "./stage-actions";

type LeadWithActivities = Lead & { activities: Activity[] };

/**
 * Whatever is under the pointer wins. closestCorners measures corner
 * distance, which on tall columns can resolve to a neighbouring column and
 * drop the card in the wrong stage.
 */
const collisionDetection: CollisionDetection = (args) => {
  const underPointer = pointerWithin(args);
  return underPointer.length > 0 ? underPointer : closestCenter(args);
};

export function LeadsBoard({
  leads,
  templates,
}: {
  leads: LeadWithActivities[];
  templates: Template[];
}) {
  const boardStages = useBoardStages();
  const stageKeys = boardStages.map((s) => s.key);
  const labelOf = (key: string) =>
    boardStages.find((s) => s.key === key)?.label ?? key;

  const [localLeads, setLocalLeads] = useState(leads);
  // Column order is held locally during a drag for the same reason cards
  // are: waiting for the server to answer makes the board feel broken.
  const [columnOrder, setColumnOrder] = useState<string[]>(
    boardStages.filter((s) => s.kind === "open").map((s) => s.id),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [mobileStage, setMobileStage] = useState<LeadStage>(
    boardStages[0]?.key ?? "new_lead",
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [logType, setLogType] = useState<ActivityType>("note");
  const [temp, setTemp] = useState<LeadTemperature | null>(null);
  const [due, setDue] = useState<DueFilter | null>(null);
  const dragStartStage = useRef<LeadStage | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resync optimistic drag state once the server revalidates
    setLocalLeads(leads);
  }, [leads]);

  /**
   * The working columns as the server sees them, as a plain string.
   *
   * A primitive on purpose. Depending on the array meant the effect fired
   * on every render, set new state, and re-rendered, forever. Comparing
   * the ids themselves means it fires when a bucket is genuinely added,
   * removed or moved, and not otherwise.
   */
  const serverOrder = boardStages
    .filter((s) => s.kind === "open")
    .map((s) => s.id)
    .join(",");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- adopt the server's order once it changes
    setColumnOrder(serverOrder ? serverOrder.split(",") : []);
  }, [serverOrder]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    // A finger has to rest before it drags, which leaves quick horizontal
    // movement free for the swipe. Without this, dnd-kit claims every touch
    // and swiping does nothing.
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
  );

  /**
   * The columns as drawn: working buckets in the order held locally, then
   * won and lost, which are outcomes and always sit at the end.
   */
  const columns = useMemo(() => {
    const open = boardStages.filter((s) => s.kind === "open");
    const ordered = columnOrder
      .map((id) => open.find((s) => s.id === id))
      .filter((s): s is (typeof open)[number] => Boolean(s));
    // Anything the local order has not caught up with yet still gets drawn.
    const missing = open.filter((s) => !columnOrder.includes(s.id));
    return [
      ...ordered,
      ...missing,
      ...boardStages.filter((s) => s.kind !== "open"),
    ];
  }, [boardStages, columnOrder]);

  const activeColumn = activeId
    ? (boardStages.find((s) => s.id === activeId) ?? null)
    : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return localLeads.filter((lead) => {
      if (!matchesFilters(lead, temp, due)) return false;
      if (!q) return true;
      return [lead.name, lead.companyName, lead.phone]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q));
    });
  }, [localLeads, query, temp, due]);

  /**
   * Swipe right: one bucket forward. Swipe left: off the board.
   * Both are one tap from being undone, because a thumb makes mistakes a
   * mouse does not.
   */
  /** Left swipe, where there is a bucket behind to step into. */
  function swipeBack(leadId: string) {
    const lead = localLeads.find((l) => l.id === leadId);
    if (!lead) return;
    const previous = prevStage(lead.stage, boardStages);
    if (!previous) return;
    const from = lead.stage;
    moveStage(leadId, previous);
    toast(`${lead.name} moved back to ${labelOf(previous)}`, {
      action: { label: "Undo", onClick: () => moveStage(leadId, from) },
    });
  }

  function swipeForward(leadId: string) {
    const lead = localLeads.find((l) => l.id === leadId);
    if (!lead) return;
    const next = nextStage(lead.stage, boardStages);
    if (!next) return;
    const from = lead.stage;
    moveStage(leadId, next);
    toast(`${lead.name} moved to ${labelOf(next)}`, {
      action: { label: "Undo", onClick: () => moveStage(leadId, from) },
    });
  }

  function swipeArchive(leadId: string) {
    const lead = localLeads.find((l) => l.id === leadId);
    if (!lead) return;
    const from = lead.stage;
    moveStage(leadId, "contact");
    toast(`${lead.name} moved to Contacts`, {
      action: { label: "Undo", onClick: () => moveStage(leadId, from) },
    });
  }

  /** A drop target is either a column (stage id) or another card (lead id). */
  function stageOf(id: string, source: Lead[]): LeadStage | null {
    // A column is now both a drop target (keyed by stage key) and a
    // sortable (keyed by row id) on the same element, so collision
    // detection can hand back either. Both have to resolve, or a card
    // dropped on a column header goes nowhere.
    if (stageKeys.includes(id)) return id as LeadStage;
    const asColumn = boardStages.find((st) => st.id === id);
    if (asColumn) return asColumn.key;
    return source.find((l) => l.id === id)?.stage ?? null;
  }

  /** The column something belongs to, whatever kind of id it is. */
  function columnIdOf(id: string, source: Lead[]): string | null {
    if (boardStages.some((st) => st.id === id)) return id;
    const key = stageOf(id, source);
    return key ? (boardStages.find((st) => st.key === key)?.id ?? null) : null;
  }

  function persist(stage: LeadStage, source: Lead[]) {
    const orderedIds = source.filter((l) => l.stage === stage).map((l) => l.id);
    startTransition(async () => {
      await reorderStage(stage, orderedIds);
    });
  }

  /** Closing a deal is the one moment worth celebrating. */
  function celebrateIfWon(leadId: string, stage: LeadStage) {
    const previous = localLeads.find((l) => l.id === leadId)?.stage;
    if (stage === "won" && previous !== "won") {
      fireConfetti();
    }
  }

  function moveStage(leadId: string, stage: LeadStage) {
    celebrateIfWon(leadId, stage);
    const next = localLeads.map((l) => (l.id === leadId ? { ...l, stage } : l));
    setLocalLeads(next);
    persist(stage, next);
  }

  function openRecord(leadId: string) {
    setLogType("note");
    setSelectedId(leadId);
  }

  /** Reaching out from a card opens the record with the log ready. */
  function handleContact(leadId: string, type: ActivityType) {
    setLogType(type);
    setSelectedId(leadId);
  }

  /** True when what is being dragged is a column, not a card. */
  function isColumn(id: string) {
    return boardStages.some((s) => s.id === id);
  }

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    if (isColumn(id)) {
      setActiveId(id);
      return;
    }
    dragStartStage.current = localLeads.find((l) => l.id === id)?.stage ?? null;
    setActiveId(id);
  }

  /**
   * While dragging, move the card between columns in local state so the
   * destination column opens a gap under the pointer.
   */
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    if (isColumn(String(active.id))) return;

    const draggedId = String(active.id);
    const overId = String(over.id);
    if (draggedId === overId) return;

    setLocalLeads((prev) => {
      const dragged = prev.find((l) => l.id === draggedId);
      const overStage = stageOf(overId, prev);
      if (!dragged || !overStage || dragged.stage === overStage) return prev;

      const withStage = prev.map((l) =>
        l.id === draggedId ? { ...l, stage: overStage } : l,
      );

      const from = withStage.findIndex((l) => l.id === draggedId);
      const to = withStage.findIndex((l) => l.id === overId);
      return to === -1 ? withStage : arrayMove(withStage, from, to);
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const draggedId = String(active.id);
    const overId = String(over.id);

    if (isColumn(draggedId)) {
      // Dropping a column onto won or lost is a no-op rather than an
      // error: those two are pinned to the end and cannot take a place.
      const from = columnOrder.indexOf(draggedId);
      // The thing under the pointer may be a card, a drop key or the
      // column itself. All three mean the same column.
      const to = columnOrder.indexOf(columnIdOf(overId, localLeads) ?? "");
      if (from === -1 || to === -1 || from === to) return;

      const next = arrayMove(columnOrder, from, to);
      setColumnOrder(next);
      startTransition(async () => {
        const result = await reorderStages(next);
        if (result.error) toast.error(result.error);
      });
      return;
    }

    const dragged = localLeads.find((l) => l.id === draggedId);
    if (!dragged) return;

    const destStage = stageOf(overId, localLeads) ?? dragged.stage;

    // dragOver may already have moved it, so compare against the stage it
    // started the drag in.
    if (destStage === "won" && dragStartStage.current !== "won") {
      fireConfetti();
    }
    let next = localLeads;

    if (draggedId !== overId) {
      const from = localLeads.findIndex((l) => l.id === draggedId);
      const to = localLeads.findIndex((l) => l.id === overId);
      if (to !== -1) next = arrayMove(localLeads, from, to);
    }

    next = next.map((l) =>
      l.id === draggedId ? { ...l, stage: destStage } : l,
    );

    setLocalLeads(next);
    persist(destStage, next);
  }

  const selectedLead = localLeads.find((l) => l.id === selectedId) ?? null;
  const activeLead = activeId
    ? (localLeads.find((l) => l.id === activeId) ?? null)
    : null;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-col gap-3 px-4 pt-4 pb-2 md:px-6">
        {/* Numbers, then search, then the add button, all on one line so
            the board starts higher up the screen. */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Scorecard leads={localLeads} />

          {/* One row on a phone: the button takes a third, search the
              rest. Stacked, these two ate most of the height above the
              cards, which is the part of the screen a rep actually
              works in. */}
          <div className="flex items-center gap-2 md:contents">
            <div className="w-1/3 shrink-0 md:order-last md:ml-auto md:w-auto">
              <QuickAddLeadDialog
                highlight={!localLeads.some((l) => !l.isSample)}
              />
            </div>

            <div className="relative min-w-0 flex-1 md:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-[var(--board-ink-muted)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, company, phone..."
                className="h-10 w-full rounded-lg border-0 bg-white pr-3 pl-8 text-sm text-[var(--board-ink)] shadow-sm outline-none placeholder:text-[var(--board-ink-muted)] focus:ring-2 focus:ring-white/80 md:h-9"
              />
            </div>
          </div>
        </div>

        {localLeads.some((l) => l.isSample) && (
          <SampleBanner count={localLeads.filter((l) => l.isSample).length} />
        )}

        <BoardFilters
          temp={temp}
          due={due}
          onTemp={setTemp}
          onDue={setDue}
          showing={filtered.length}
          total={localLeads.length}
        />

        <div className="flex gap-1.5 overflow-x-auto md:hidden">
          {boardStages.map((stage) => (
            <button
              key={stage.key}
              onClick={() => setMobileStage(stage.key)}
              className={cn(
                "shrink-0 rounded-full px-3 py-2 text-xs font-medium transition-colors",
                mobileStage === stage.key
                  ? "bg-white text-[var(--board-ink)]"
                  : "bg-white/25 text-white hover:bg-white/35",
              )}
            >
              {stage.label} (
              {filtered.filter((l) => l.stage === stage.key).length})
            </button>
          ))}
        </div>
      </div>

      <DndContext
        id="leads-board"
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        {/* Vertical padding keeps the drop-target glow from being clipped
            by this scroll container. */}
        <div className="flex flex-1 items-start gap-3 overflow-x-auto overflow-y-hidden px-4 pt-1.5 pb-5 md:px-6">
          <SortableContext
            items={columnOrder}
            strategy={horizontalListSortingStrategy}
          >
            {columns.map((stage) => (
              <div
                key={stage.id}
                className={cn(
                  "flex max-h-full",
                  stage.key === mobileStage ? "w-full" : "hidden",
                  "md:flex md:w-auto",
                )}
              >
                <LeadColumn
                  stage={stage}
                  leads={filtered.filter((l) => l.stage === stage.key)}
                  totalCount={
                    localLeads.filter((l) => l.stage === stage.key).length
                  }
                  templates={templates}
                  isDropTarget={!!activeLead && activeLead.stage === stage.key}
                  onCardClick={openRecord}
                  onMove={moveStage}
                  onSwipeForward={swipeForward}
                  onSwipeBack={swipeBack}
                  onSwipeArchive={swipeArchive}
                  onContact={handleContact}
                />
              </div>
            ))}
          </SortableContext>

          {/* Sits in the row with the columns, and only on a wide screen:
              a phone shows one bucket at a time, so a bucket-shaped button
              among them would read as another bucket. */}
          <div className="hidden md:flex">
            <AddStageButton
              openCount={boardStages.filter((s) => s.kind === "open").length}
            />
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeLead ? (
            <LeadCardView lead={activeLead} templates={templates} overlay />
          ) : activeColumn ? (
            // A column being dragged shows its name, not a clone of the
            // whole column, which at full height covers half the board.
            <div className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[var(--board-ink)] shadow-lg">
              {activeColumn.label}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {selectedLead && (
        <LeadDetailDialog
          lead={selectedLead}
          templates={templates}
          initialLogType={logType}
          open={!!selectedId}
          onOpenChange={(open) => !open && setSelectedId(null)}
        />
      )}
    </div>
  );
}
