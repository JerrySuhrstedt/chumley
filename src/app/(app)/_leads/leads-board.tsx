"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Activity, Lead, Template } from "@/db/schema";
import { type LeadStage, reorderStage } from "./actions";
import { LeadCardView } from "./lead-card";
import { LeadColumn } from "./lead-column";
import { LeadDetailDialog } from "./lead-detail-dialog";
import { STAGES } from "./stages";

type LeadWithActivities = Lead & { activities: Activity[] };

const STAGE_VALUES = STAGES.map((s) => s.value) as string[];

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
  const [activeId, setActiveId] = useState<string | null>(null);
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

  /** A drop target is either a column (stage id) or another card (lead id). */
  function stageOf(id: string, source: Lead[]): LeadStage | null {
    if (STAGE_VALUES.includes(id)) return id as LeadStage;
    return source.find((l) => l.id === id)?.stage ?? null;
  }

  function persist(stage: LeadStage, source: Lead[]) {
    const orderedIds = source
      .filter((l) => l.stage === stage)
      .map((l) => l.id);
    startTransition(async () => {
      await reorderStage(stage, orderedIds);
    });
  }

  function moveStage(leadId: string, stage: LeadStage) {
    const next = localLeads.map((l) =>
      l.id === leadId ? { ...l, stage } : l
    );
    setLocalLeads(next);
    persist(stage, next);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  /**
   * While dragging, move the card between columns in local state so the
   * destination column opens a gap under the pointer.
   */
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const draggedId = String(active.id);
    const overId = String(over.id);
    if (draggedId === overId) return;

    setLocalLeads((prev) => {
      const dragged = prev.find((l) => l.id === draggedId);
      const overStage = stageOf(overId, prev);
      if (!dragged || !overStage || dragged.stage === overStage) return prev;

      const withStage = prev.map((l) =>
        l.id === draggedId ? { ...l, stage: overStage } : l
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

    const dragged = localLeads.find((l) => l.id === draggedId);
    if (!dragged) return;

    const destStage = stageOf(overId, localLeads) ?? dragged.stage;
    let next = localLeads;

    if (draggedId !== overId) {
      const from = localLeads.findIndex((l) => l.id === draggedId);
      const to = localLeads.findIndex((l) => l.id === overId);
      if (to !== -1) next = arrayMove(localLeads, from, to);
    }

    next = next.map((l) =>
      l.id === draggedId ? { ...l, stage: destStage } : l
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
      <div className="flex flex-col gap-3 px-4 pt-3 pb-2 md:px-6">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-[var(--board-ink-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, company, or phone..."
            className="h-10 w-full rounded-lg border-0 bg-white pr-3 pl-8 text-sm text-[var(--board-ink)] shadow-sm outline-none placeholder:text-[var(--board-ink-muted)] focus:ring-2 focus:ring-white/80 md:h-9"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto md:hidden">
          {STAGES.map((stage) => (
            <button
              key={stage.value}
              onClick={() => setMobileStage(stage.value)}
              className={cn(
                "shrink-0 rounded-full px-3 py-2 text-xs font-medium transition-colors",
                mobileStage === stage.value
                  ? "bg-white text-[var(--board-ink)]"
                  : "bg-white/25 text-white hover:bg-white/35"
              )}
            >
              {stage.label} (
              {filtered.filter((l) => l.stage === stage.value).length})
            </button>
          ))}
        </div>
      </div>

      <DndContext
        id="leads-board"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex flex-1 items-start gap-3 overflow-x-auto overflow-y-hidden px-4 pb-4 md:px-6">
          {STAGES.map((stage) => (
            <div
              key={stage.value}
              className={cn(
                "flex max-h-full",
                stage.value === mobileStage ? "w-full" : "hidden",
                "md:flex md:w-auto"
              )}
            >
              <LeadColumn
                stage={stage.value}
                label={stage.label}
                leads={filtered.filter((l) => l.stage === stage.value)}
                templates={templates}
                isDropTarget={!!activeLead && activeLead.stage === stage.value}
                onCardClick={setSelectedId}
                onMoveNext={moveStage}
              />
            </div>
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeLead ? (
            <LeadCardView lead={activeLead} templates={templates} overlay />
          ) : null}
        </DragOverlay>
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
