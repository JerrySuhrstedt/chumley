"use client";

import { useEffect, useState, useTransition } from "react";
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { Activity, Company, Contact, Deal } from "@/db/schema";
import { type DealStage, updateDealStage } from "./actions";
import { DealColumn } from "./deal-column";
import { DealDetailDialog } from "./deal-detail-dialog";

const STAGES: { value: DealStage; label: string }[] = [
  { value: "lead", label: "Lead" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal_sent", label: "Proposal Sent" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

type DealWithRelations = Deal & {
  contact: Contact | null;
  company: Company | null;
  activities: Activity[];
};

export function DealsBoard({
  deals,
  contacts,
  companies,
}: {
  deals: DealWithRelations[];
  contacts: Contact[];
  companies: Company[];
}) {
  const [localDeals, setLocalDeals] = useState(deals);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setLocalDeals(deals);
  }, [deals]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const dealId = String(active.id);
    const newStage = over.id as DealStage;
    const deal = localDeals.find((d) => d.id === dealId);
    if (!deal || deal.stage === newStage) return;

    setLocalDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d))
    );
    startTransition(async () => {
      await updateDealStage(dealId, newStage);
    });
  }

  const selectedDeal = localDeals.find((d) => d.id === selectedId) ?? null;

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <DealColumn
              key={stage.value}
              stage={stage.value}
              label={stage.label}
              deals={localDeals.filter((d) => d.stage === stage.value)}
              onCardClick={setSelectedId}
            />
          ))}
        </div>
      </DndContext>

      {selectedDeal && (
        <DealDetailDialog
          deal={selectedDeal}
          contacts={contacts}
          companies={companies}
          open={!!selectedId}
          onOpenChange={(open) => !open && setSelectedId(null)}
        />
      )}
    </>
  );
}
