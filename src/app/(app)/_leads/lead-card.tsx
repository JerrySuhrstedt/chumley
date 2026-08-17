"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Lead, Template } from "@/db/schema";
import { TapToContact } from "./tap-to-contact";
import { nextStage, STAGES } from "./stages";
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

  const upcoming = nextStage(lead.stage);
  const upcomingLabel = upcoming
    ? STAGES.find((s) => s.value === upcoming)?.label
    : null;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`gap-2 py-3 ${isDragging ? "opacity-50" : ""}`}
    >
      <CardContent
        className="flex flex-col gap-2 px-3"
        {...listeners}
        {...attributes}
      >
        <div
          className="flex cursor-grab flex-col gap-1 active:cursor-grabbing"
          onClick={onClick}
        >
          <p className="text-sm font-medium">{lead.name}</p>
          {lead.companyName && (
            <p className="text-xs text-muted-foreground">
              {lead.companyName}
            </p>
          )}
          {lead.value && (
            <p className="text-xs text-muted-foreground">${lead.value}</p>
          )}
          {lead.nextActionText && (
            <p className="truncate text-xs text-muted-foreground">
              Next: {lead.nextActionText}
            </p>
          )}
        </div>

        <TapToContact lead={lead} templates={templates} stopPropagation />

        {upcoming && upcomingLabel && (
          <Button
            variant="ghost"
            size="sm"
            className="justify-between text-xs text-muted-foreground md:hidden"
            onClick={(e) => {
              e.stopPropagation();
              onMoveNext(upcoming);
            }}
          >
            Move to {upcomingLabel}
            <ChevronRight className="size-3.5" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
