"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { logActivity, type ActivityOutcome, type ActivityType } from "./actions";
import { ACTIVITY_TYPES, outcomesFor } from "./activity-meta";

export function ActivityLogger({
  leadId,
  initialType = "note",
  onSaved,
}: {
  leadId: string;
  initialType?: ActivityType;
  onSaved?: () => void;
}) {
  const [type, setType] = useState<ActivityType>(initialType);
  const [outcome, setOutcome] = useState<ActivityOutcome | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const action = logActivity.bind(null, leadId);
  const [state, formAction, pending] = useActionState(action, { error: null });

  const outcomes = outcomesFor(type);
  const selectedOutcome = outcomes.find((o) => o.value === outcome);

  // Follow the caller when it changes which interaction is being logged
  // (e.g. tapping Call after the panel is already open).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync to the caller's requested type
    setType(initialType);
    setOutcome(null);
  }, [initialType]);

  useEffect(() => {
    if (!pending && !state.error) {
      formRef.current?.reset();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear disposition after a successful save
      setOutcome(null);
      onSaved?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, pending]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="outcome" value={outcome ?? ""} />

      <div className="flex flex-wrap gap-1.5">
        {ACTIVITY_TYPES.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setType(item.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
              type === item.value
                ? "border-[var(--board-bg)] bg-[var(--board-bg)] text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            )}
          >
            <item.icon className="size-3.5" />
            {item.label}
          </button>
        ))}
      </div>

      {outcomes.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap gap-1.5">
            {outcomes.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() =>
                  setOutcome((prev) =>
                    prev === item.value ? null : item.value
                  )
                }
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  outcome === item.value
                    ? item.className + " ring-2 ring-[var(--board-bg)]"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          {selectedOutcome?.hint && (
            <p className="text-xs text-slate-500">{selectedOutcome.hint}</p>
          )}
        </div>
      )}

      <Textarea
        name="body"
        rows={2}
        placeholder={
          type === "note" ? "What happened?" : "Add a note (optional)"
        }
        required={type === "note"}
      />

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button
        type="submit"
        size="sm"
        className="self-start"
        loading={pending}
      >
        Log it
      </Button>
    </form>
  );
}
