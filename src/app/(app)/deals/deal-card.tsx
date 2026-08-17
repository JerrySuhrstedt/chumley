"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import type { Company, Contact, Deal } from "@/db/schema";

export function DealCard({
  deal,
  onClick,
}: {
  deal: Deal & { contact: Contact | null; company: Company | null };
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: deal.id });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`cursor-grab gap-2 py-3 active:cursor-grabbing ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <CardContent className="flex flex-col gap-1 px-3">
        <p className="text-sm font-medium">{deal.name}</p>
        {deal.amount && (
          <p className="text-xs text-muted-foreground">${deal.amount}</p>
        )}
        {(deal.contact || deal.company) && (
          <p className="text-xs text-muted-foreground">
            {deal.contact
              ? `${deal.contact.firstName} ${deal.contact.lastName ?? ""}`
              : deal.company?.name}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
