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
export function AddStageButton({
  openCount,
  variant = "column",
}: {
  openCount: number;
  /**
   * "column" is the desktop shape described above. "pill" belongs in the
   * mobile stage-chip row: a phone shows one bucket at a time, so a
   * bucket-shaped add button among the columns would read as another
   * bucket, but a chip among the chips reads as "add one of these".
   */
  variant?: "column" | "pill";
}) {
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

  if (variant === "pill") {
    if (adding) {
      return (
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
          className="w-36 shrink-0 rounded-full border border-[var(--brand)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--board-ink)] outline-none focus:ring-3 focus:ring-[var(--brand)]/30"
        />
      );
    }
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-[rgba(9,30,66,0.4)] px-3 py-2 text-xs font-medium text-[var(--board-ink)] transition-colors hover:bg-black/[0.07]"
      >
        <Plus className="size-3.5" />
        Add
      </button>
    );
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
      className="flex w-72 shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[rgba(9,30,66,0.35)] px-4 py-3 text-sm font-semibold text-[var(--board-ink)] transition-colors hover:border-[rgba(9,30,66,0.6)] hover:bg-black/5"
    >
      <Plus className="size-4" />
      Add a bucket
    </button>
  );
}
