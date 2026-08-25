"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Undo2, X } from "lucide-react";
import { CALL_OUTCOMES } from "./activity-meta";
import {
  deleteActivity,
  setActivityNote,
  setActivityOutcome,
  type ActivityOutcome,
} from "./actions";

/**
 * What appears the moment a call is logged.
 *
 * The call is already saved by the time this renders, which is the whole
 * point: everything here is optional and the timeline is correct even if
 * the rep never comes back to the app. That inverts the old flow, where the
 * interaction only existed if somebody remembered to press Save.
 *
 * So this asks for the two things the app genuinely cannot know, in the
 * order they are worth: how the call went, which is one tap, and a line of
 * context, which is optional and already focused so it costs nothing to
 * ignore. Undo is here rather than a confirmation step, because a
 * misdialled number is rare and cheap to fix, while a confirm dialog is
 * charged on every single call.
 */
export function CallWrapUp({
  activityId,
  onDone,
}: {
  activityId: string;
  /** Fired when the strip should disappear, undone or finished. */
  onDone: () => void;
}) {
  const [outcome, setOutcome] = useState<ActivityOutcome | null>(null);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [working, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  // The note is written on the way out, so a rep who taps an outcome and
  // walks away does not lose what they had already typed. Mirrored into a
  // ref through an effect rather than assigned during render, so the
  // unmount cleanup below reads the latest value without the component
  // touching a ref while rendering.
  const noteRef = useRef("");

  useEffect(() => {
    noteRef.current = note;
  }, [note]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      const text = noteRef.current.trim();
      if (text) void setActivityNote(activityId, text);
    };
  }, [activityId]);

  const pick = (value: ActivityOutcome) =>
    start(async () => {
      setOutcome(value);
      await setActivityOutcome(activityId, value);
      setSaved(true);
    });

  const undo = () =>
    start(async () => {
      noteRef.current = "";
      await deleteActivity(activityId);
      onDone();
    });

  const finish = () =>
    start(async () => {
      const text = noteRef.current.trim();
      noteRef.current = "";
      if (text) await setActivityNote(activityId, text);
      onDone();
    });

  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-[var(--brand)]/30 bg-[var(--brand-tint)] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
          <Check className="size-4 text-emerald-600" />
          Call logged
          {saved && (
            <span className="font-normal text-slate-500">· saved</span>
          )}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={undo}
            disabled={working}
            className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-white hover:text-slate-800 disabled:opacity-50"
          >
            <Undo2 className="size-3.5" />
            Undo
          </button>
          <button
            type="button"
            aria-label="Done"
            onClick={finish}
            disabled={working}
            className="rounded p-1 text-slate-400 transition-colors hover:bg-white hover:text-slate-700 disabled:opacity-50"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CALL_OUTCOMES.map((o) => (
          <button
            key={o.value}
            type="button"
            disabled={working}
            onClick={() => pick(o.value)}
            aria-pressed={outcome === o.value}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-all disabled:opacity-60 ${
              outcome === o.value
                ? `${o.className} ring-2 ring-slate-900/15`
                : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <input
        ref={inputRef}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            finish();
          }
        }}
        placeholder="One line, if it needs one. Left voicemail, call back Tuesday..."
        maxLength={2000}
        className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
      />
    </div>
  );
}
