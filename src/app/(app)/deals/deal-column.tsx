"use client";

import { useDroppable } from "@dnd-kit/core";
import type { Company, Contact, Deal } from "@/db/schema";
import { DealCard } from "./deal-card";

export function DealColumn({
  stage,
  label,
  deals,
  onCardClick,
}: {
  stage: string;
  label: string;
  deals: (Deal & { contact: Contact | null; company: Company | null })[];
  onCardClick: (dealId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  const total = deals.reduce((sum, d) => sum + Number(d.amount ?? 0), 0);

  return (
    <div className="flex w-64 shrink-0 flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-medium">{label}</h2>
        <span className="text-xs text-muted-foreground">
          {deals.length}
          {total > 0 ? ` · $${total.toLocaleString()}` : ""}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-24 flex-1 flex-col gap-2 rounded-lg border border-dashed p-2 transition-colors ${
          isOver ? "border-primary bg-primary/5" : "border-transparent"
        }`}
      >
        {deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            onClick={() => onCardClick(deal.id)}
          />
        ))}
      </div>
    </div>
  );
}
