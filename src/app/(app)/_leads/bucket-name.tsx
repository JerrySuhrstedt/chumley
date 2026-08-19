"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { renameStage } from "./stage-actions";

/**
 * Click the bucket name to rename it.
 *
 * Only the label changes. Leads reference the bucket by a key that never
 * moves, so renaming touches no lead and no history.
 */
export function BucketName({
  stageId,
  label,
}: {
  stageId: string;
  label: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- follow a rename made elsewhere
    setDraft(label);
  }, [label]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commit() {
    setEditing(false);
    const next = draft.trim();
    if (next === label) return;
    startTransition(async () => {
      await renameStage(stageId, next);
    });
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            setDraft(label);
            setEditing(false);
          }
        }}
        maxLength={30}
        aria-label={`Rename ${label} bucket`}
        className="w-full min-w-0 rounded border border-[var(--board-bg)] bg-white px-1.5 py-0.5 text-[1.2rem] font-semibold text-[var(--board-ink)] outline-none"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title="Rename this bucket"
      className="-mx-1 block max-w-full truncate rounded px-1 text-left text-[1.2rem] leading-tight font-semibold text-[var(--board-ink)] hover:bg-black/5"
    >
      {label}
    </button>
  );
}
