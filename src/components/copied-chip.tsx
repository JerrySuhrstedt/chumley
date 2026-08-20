"use client";

import { Check } from "lucide-react";

/**
 * The confirmation that a copy actually happened.
 *
 * A button whose label flips instantly from "Copy link" to "Copied!" is
 * easy to miss, because nothing moved and the eye was on the clipboard
 * target rather than the button. A small chip that rises into place is
 * noticed without being read, which is the whole job.
 *
 * It rides above the button rather than replacing its label, so the
 * button keeps its width and the row does not twitch.
 */
export function CopiedChip({ show }: { show: boolean }) {
  return (
    <span
      aria-hidden={!show}
      className={`pointer-events-none absolute -top-1 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-md bg-[var(--board-ink)] px-2 py-1 text-xs font-semibold whitespace-nowrap text-white transition-all duration-200 motion-reduce:transition-none ${
        show
          ? "-translate-y-full opacity-100"
          : "translate-y-0 opacity-0"
      }`}
    >
      <Check className="size-3" strokeWidth={3} />
      Copied
    </span>
  );
}
