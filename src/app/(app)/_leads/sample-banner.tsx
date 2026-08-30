"use client";

import { useTransition } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { clearSamples } from "./actions";

/**
 * Sits above the board until the demo deals are gone. It has to be
 * impossible to mistake three fake people for real ones, and impossible
 * not to find the way to remove them.
 *
 * Stacked on a phone, one row from sm: up. In a single row the button's
 * shrink-0 squeezed the copy into a one-word-per-line column on narrow
 * screens, and the banner grew to ~180px of the space a rep works in.
 */
export function SampleBanner({ count }: { count: number }) {
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-black/[0.05] px-3 py-2 text-sm text-[var(--board-ink)] sm:flex-row sm:items-center sm:gap-3">
      <div className="flex min-w-0 items-start gap-2 sm:flex-1 sm:items-center sm:gap-3">
        <Sparkles className="mt-0.5 size-4 shrink-0 sm:mt-0" />
        <p className="min-w-0">
          {count} of these are examples so you can try things out. Drag them,
          open them, change them. Nothing here is real.
        </p>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => await clearSamples())}
        className="flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-black/[0.08] px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-black/[0.14] disabled:opacity-60 sm:self-auto"
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <X className="size-3.5" />
        )}
        Clear the examples
      </button>
    </div>
  );
}
