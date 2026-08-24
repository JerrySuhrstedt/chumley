"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { addStage } from "./stage-actions";
import { MAX_OPEN_STAGES } from "./stage-limits";

/**
 * The column that adds a column.
 *
 * Deliberately the same width and shape as a real one and sitting in the
 * same row, so the board says what it can do without a settings screen
 * having to explain it. It disappears at the limit rather than sitting
 * there refusing, because a control that never works is worse than one
 * that is not there.
 */
export function AddStageButton({ openCount }: { openCount: number }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [, startTransition] = useTransition();

  if (openCount >= MAX_OPEN_STAGES) return null;

  function commit() {
    const name = draft.trim();
    setAdding(false);
    setDraft("");
    if (!name) return;

    startTransition(async () => {
      const result = await addStage(name);
      if (result.error) toast.error(result.error);
    });
  }

  if (adding) {
    return (
      <div className="flex max-h-full w-72 shrink-0 flex-col rounded-xl bg-[var(--board-column)] p-2">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              setDraft("");
              setAdding(false);
            }
          }}
          maxLength={24}
          placeholder="Name this bucket"
          aria-label="Name the new bucket"
          className="w-full rounded-lg border border-[var(--brand)] bg-white px-2.5 py-2 text-sm font-semibold text-[var(--board-ink)] outline-none focus:ring-3 focus:ring-[var(--brand)]/30"
        />
        <p className="px-1 pt-1.5 text-xs text-[var(--board-ink-muted)]">
          Press Enter to add it. {MAX_OPEN_STAGES - openCount} left.
        </p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setAdding(true)}
      className="flex w-72 shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/25 px-4 py-3 text-sm font-semibold text-white/70 transition-colors hover:border-white/45 hover:bg-white/5 hover:text-white"
    >
      <Plus className="size-4" />
      Add a bucket
    </button>
  );
}
