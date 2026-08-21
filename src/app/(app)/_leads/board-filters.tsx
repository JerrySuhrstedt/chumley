"use client";

import { ChevronDown, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
 * The three temperatures behind one chip, for phones.
 *
 * Chosen shows as that temperature's own colour and name, so the row
 * still answers "what am I filtered to" without being opened.
 */
function TempMenu({
  temp,
  onTemp,
}: {
  temp: LeadTemperature | null;
  onTemp: (value: LeadTemperature | null) => void;
}) {
  const chosen = TEMPERATURES.find((t) => t.value === temp) ?? null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Filter by temperature"
        style={
          chosen
            ? { backgroundColor: chosen.bg, borderColor: chosen.bg }
            : { borderColor: "rgba(255,255,255,0.45)" }
        }
        className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors sm:hidden ${
          chosen ? "text-white shadow-sm" : "bg-white/15 text-white"
        }`}
      >
        {chosen ? (
          <chosen.icon className="size-3.5" strokeWidth={2.5} />
        ) : null}
        {chosen ? chosen.label : "Temp"}
        <ChevronDown className="size-3.5 opacity-80" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-40">
        {TEMPERATURES.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => onTemp(temp === t.value ? null : t.value)}
          >
            <span
              aria-hidden
              className="mr-1 flex size-5 items-center justify-center rounded-full"
              style={{ backgroundColor: t.bg }}
            >
              <t.icon className="size-3 text-white" strokeWidth={2.6} />
            </span>
            <span style={{ color: t.bg }} className="font-semibold">
              {t.label}
            </span>
            {temp === t.value && (
              <X className="ml-auto size-3.5 text-slate-400" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * The four next-step states behind one chip, for phones.
 *
 * Called "Next step" rather than "Timing" because one of the four is not
 * a time: a deal with nothing planned is the most important thing in the
 * list, and a heading about when would not cover it.
 */
function DueMenu({
  due,
  onDue,
}: {
  due: DueFilter | null;
  onDue: (value: DueFilter | null) => void;
}) {
  const chosen = DUE_FILTERS.find((d) => d.value === due) ?? null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Filter by next step"
        style={
          chosen
            ? { backgroundColor: chosen.color, borderColor: chosen.color }
            : { borderColor: "rgba(255,255,255,0.45)" }
        }
        className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors sm:hidden ${
          chosen
            ? // "Due today" is yellow, and white on yellow cannot be read.
              chosen.value === "today"
              ? "text-[var(--board-ink)] shadow-sm"
              : "text-white shadow-sm"
            : "bg-white/15 text-white"
        }`}
      >
        {chosen ? chosen.label : "Next step"}
        <ChevronDown className="size-3.5 opacity-80" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-44">
        {DUE_FILTERS.map((d) => (
          <DropdownMenuItem
            key={d.value}
            onClick={() => onDue(due === d.value ? null : d.value)}
          >
            <span
              aria-hidden
              className="mr-1 size-3 shrink-0 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="font-medium">{d.label}</span>
            {due === d.value && (
              <X className="ml-auto size-3.5 text-slate-400" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
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
      {/* Three chips on a phone pushed the board a whole row down. One
          chip that opens the three costs a tap and gives the row back. A
          desktop has the width, so it keeps them laid out. */}
      <TempMenu temp={temp} onTemp={onTemp} />

      <div className="hidden items-center gap-1.5 sm:flex">
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
      </div>

      <DueMenu due={due} onDue={onDue} />

      <span className="mx-1 hidden h-5 w-px bg-white/25 sm:block" />

      <div className="hidden items-center gap-1.5 sm:flex">
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
      </div>

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
