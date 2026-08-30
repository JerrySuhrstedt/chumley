"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  deleteActivity,
  logActivity,
  type ActivityOutcome,
  type ActivityType,
} from "./actions";
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
  const [body, setBody] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  // Mirrored into refs through effects rather than assigned during
  // render, so the unmount commit below reads the latest values without
  // the component touching a ref while rendering. Same shape as the
  // wrap-up strip and the history editor, which both save on the way out.
  const bodyRef = useRef("");
  const typeRef = useRef<ActivityType>(initialType);
  const outcomeRef = useRef<ActivityOutcome | null>(null);
  useEffect(() => {
    bodyRef.current = body;
  }, [body]);
  useEffect(() => {
    typeRef.current = type;
    outcomeRef.current = outcome;
  }, [type, outcome]);

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
      setBody("");
      onSaved?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, pending]);

  /**
   * Typing was the deliberate act; pressing Log it was ceremony. Clicking
   * away used to throw the words out, which for a rep between jobs is
   * silent data loss. So leaving commits whatever was typed, exactly like
   * the two components either side of this one, and a toast carries the
   * undo in place of the confirmation that no longer exists. The ref is
   * cleared before the write so the submit path and this one can never
   * both fire for the same words.
   */
  useEffect(() => {
    return () => {
      const text = bodyRef.current.trim();
      if (!text) return;
      bodyRef.current = "";
      const fd = new FormData();
      fd.set("type", typeRef.current);
      fd.set("outcome", outcomeRef.current ?? "");
      fd.set("body", text);
      void logActivity(leadId, { error: null }, fd).then((res) => {
        if (res.error || !res.activityId) return;
        const id = res.activityId;
        toast("Saved what you typed", {
          description: "Leaving the box saves it. Undo if it was a draft.",
          action: { label: "Undo", onClick: () => void deleteActivity(id) },
        });
      });
    };
  }, [leadId]);

  return (
    <form
      ref={formRef}
      action={formAction}
      // The explicit submit owns these words now; without this the
      // unmount commit would write them a second time.
      onSubmit={() => {
        bodyRef.current = "";
      }}
      className="flex flex-col gap-3"
    >
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
                ? "border-[var(--brand)] bg-[var(--brand)] text-white"
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
                    ? item.className + " ring-2 ring-[var(--brand)]"
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
        value={body}
        onChange={(e) => setBody(e.target.value)}
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
