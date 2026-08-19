"use client";

import { useOptimistic, useTransition } from "react";
import { Flame, Snowflake, Sun } from "lucide-react";
import { setTemperature, type LeadTemperature } from "./actions";

const CHOICES: {
  value: LeadTemperature;
  label: string;
  icon: typeof Flame;
  /** Filled when chosen. */
  bg: string;
  /** Outline and icon when not chosen. */
  ink: string;
  ring: string;
}[] = [
  {
    value: "hot",
    label: "Hot",
    icon: Flame,
    bg: "#e0402c",
    ink: "#c2381f",
    ring: "rgba(224,64,44,0.35)",
  },
  {
    value: "warm",
    label: "Warm",
    icon: Sun,
    bg: "#e08a1e",
    ink: "#b06a12",
    ring: "rgba(224,138,30,0.35)",
  },
  {
    value: "cold",
    label: "Cold",
    icon: Snowflake,
    bg: "#2f7fd1",
    ink: "#2569ad",
    ring: "rgba(47,127,209,0.35)",
  },
];

/**
 * How warm the lead feels, set by hand.
 *
 * Nothing computes this and nothing should: a rep knows from the call
 * whether somebody is buying, and a score derived from clicks would just
 * be wrong with more confidence.
 */
export function TemperaturePicker({
  leadId,
  value,
}: {
  leadId: string;
  value: LeadTemperature | null;
}) {
  const [pending, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(value);

  function pick(next: LeadTemperature) {
    // Tapping the current one clears it, so a mis-tap is one tap to undo.
    const target = shown === next ? null : next;
    startTransition(async () => {
      setShown(target);
      await setTemperature(leadId, target);
    });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-900">Lead temperature</p>
      <p className="mt-0.5 text-xs text-slate-500">
        How close are they to buying?
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {CHOICES.map((c) => {
          const active = shown === c.value;
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => pick(c.value)}
              disabled={pending}
              aria-pressed={active}
              title={active ? `Clear ${c.label}` : `Mark ${c.label}`}
              style={
                active
                  ? {
                      backgroundColor: c.bg,
                      borderColor: c.bg,
                      boxShadow: `0 6px 16px -6px ${c.ring}`,
                    }
                  : { borderColor: "#e2e8f0" }
              }
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 transition-all active:scale-95 ${
                active
                  ? "text-white"
                  : "bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <c.icon
                className={active ? "size-7" : "size-7"}
                style={active ? undefined : { color: c.ink }}
                strokeWidth={active ? 2.4 : 2}
              />
              <span className="text-xs font-bold tracking-wide uppercase">
                {c.label}
              </span>
            </button>
          );
        })}
      </div>

      {shown && (
        <p className="mt-2 text-center text-xs text-slate-400">
          Tap it again to clear
        </p>
      )}
    </div>
  );
}
