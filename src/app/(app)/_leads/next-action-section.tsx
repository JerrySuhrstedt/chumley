"use client";

import { useActionState, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Lead } from "@/db/schema";
import { completeNextAction, setNextAction } from "./actions";
import { nextActionStatus } from "./stages";

/**
 * When a follow-up is due, in one tap.
 *
 * A bare date input asks a rep to open a calendar, find today, count
 * forward and pick, which is four decisions to express something they
 * already said out loud as "next week". These four cover most of what
 * anybody actually chooses; the picker stays for the rest.
 *
 * Local dates, deliberately. toISOString converts to UTC first, so an
 * evening in Arizona becomes tomorrow and "call them tomorrow" lands on
 * the wrong day for the whole of the Americas.
 */
const PRESETS: { label: string; days: number }[] = [
  { label: "Tomorrow", days: 1 },
  { label: "In 3 days", days: 3 },
  { label: "Next week", days: 7 },
  { label: "In 2 weeks", days: 14 },
];

function inDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function NextActionSection({ lead }: { lead: Lead }) {
  const [editing, setEditing] = useState(false);
  const [due, setDue] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const action = lead.nextActionText
    ? completeNextAction.bind(null, lead.id)
    : setNextAction.bind(null, lead.id);

  const [state, formAction, pending] = useActionState(
    async (prevState: { error: string | null }, formData: FormData) => {
      const result = await action(prevState, formData);
      if (!result.error) {
        setEditing(false);
      }
      return result;
    },
    { error: null }
  );

  if (!editing) {
    // Same urgency color the card wears on the board, so the two views agree.
    const status = nextActionStatus(lead);
    const ink = status.key === "today" || status.key === "none" ? "#172b4d" : "#fff";

    return (
      <div
        className="flex items-center justify-between rounded-md p-3"
        style={{ backgroundColor: status.color, color: ink }}
      >
        <div>
          <p className="text-xs opacity-80">What&apos;s next</p>
          {lead.nextActionText ? (
            <>
              <p className="text-sm font-medium">{lead.nextActionText}</p>
              {lead.nextActionDue && (
                <p className="text-xs opacity-80">Due {lead.nextActionDue}</p>
              )}
            </>
          ) : (
            <p className="text-sm opacity-80">Nothing set yet</p>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-transparent bg-white text-[#172b4d] hover:bg-white/90 hover:text-[#172b4d]"
          onClick={() => setEditing(true)}
        >
          {lead.nextActionText ? "Mark done" : "Set what's next"}
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-md border p-3">
      {lead.nextActionText && (
        <p className="text-xs text-muted-foreground">
          Done: {lead.nextActionText} ... what&apos;s next?
        </p>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="nextActionText">What&apos;s next</Label>
        <Input
          id="nextActionText"
          name="nextActionText"
          placeholder="Call to follow up"
          required
          autoFocus
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>When</Label>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => {
            const value = inDays(p.days);
            const active = due === value;
            return (
              <button
                key={p.label}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setDue(value);
                  setShowPicker(false);
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-[var(--brand)] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {p.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setShowPicker((v) => !v)}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              showPicker
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <CalendarDays className="size-3.5" />
            Pick a date
          </button>
        </div>

        {/* The real field either way. The presets write into it rather than
            replacing it, so there is one value submitted and no second
            source of truth to disagree with. */}
        <Input
          id="nextActionDue"
          name="nextActionDue"
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className={showPicker ? "" : "sr-only"}
        />
      </div>
      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" size="sm" loading={pending}>
        Save
      </Button>
    </form>
  );
}
