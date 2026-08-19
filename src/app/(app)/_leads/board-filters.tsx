"use client";

import { X } from "lucide-react";
import type { Lead } from "@/db/schema";
import type { LeadTemperature } from "./actions";
import { nextActionStatus } from "./stages";
import { TEMPERATURES } from "./temperature";

export type DueFilter = "overdue" | "today" | "upcoming" | "none";

export const DUE_FILTERS: { value: DueFilter; label: string; color: string }[] =
  [
    { value: "overdue", label: "Late", color: "var(--label-overdue)" },
    { value: "today", label: "Due today", color: "var(--label-today)" },
    { value: "upcoming", label: "Coming up", color: "var(--label-upcoming)" },
    { value: "none", label: "No next step", color: "var(--label-none)" },
  ];

/** True when the lead survives the current filters. */
export function matchesFilters(
  lead: Lead,
  temp: LeadTemperature | null,
  due: DueFilter | null
) {
  if (temp && lead.temperature !== temp) return false;
  if (due && nextActionStatus(lead).key !== due) return false;
  return true;
}

function Chip({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={
        active
          ? { backgroundColor: color, borderColor: color }
          : { borderColor: "rgba(255,255,255,0.45)" }
      }
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "text-white shadow-sm"
          : "bg-white/15 text-white hover:bg-white/25"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Two questions a rep actually asks: who is worth my time, and what needs
 * doing. One chip from each, combined.
 */
export function BoardFilters({
  temp,
  due,
  onTemp,
  onDue,
  showing,
  total,
}: {
  temp: LeadTemperature | null;
  due: DueFilter | null;
  onTemp: (value: LeadTemperature | null) => void;
  onDue: (value: DueFilter | null) => void;
  showing: number;
  total: number;
}) {
  const filtering = temp !== null || due !== null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {TEMPERATURES.map((t) => (
        <Chip
          key={t.value}
          active={temp === t.value}
          color={t.bg}
          onClick={() => onTemp(temp === t.value ? null : t.value)}
        >
          <t.icon className="size-3.5" strokeWidth={2.5} />
          {t.label}
        </Chip>
      ))}

      <span className="mx-1 hidden h-5 w-px bg-white/25 sm:block" />

      {DUE_FILTERS.map((d) => (
        <Chip
          key={d.value}
          active={due === d.value}
          color={d.color}
          onClick={() => onDue(due === d.value ? null : d.value)}
        >
          {d.label}
        </Chip>
      ))}

      {filtering && (
        <button
          type="button"
          onClick={() => {
            onTemp(null);
            onDue(null);
          }}
          className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/15 hover:text-white"
        >
          <X className="size-3.5" />
          Clear ({showing} of {total})
        </button>
      )}
    </div>
  );
}
