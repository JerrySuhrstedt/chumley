"use client";

import { useTransition } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { clearSamples } from "./actions";

/**
 * Sits above the board until the demo deals are gone. It has to be
 * impossible to mistake three fake people for real ones, and impossible
 * not to find the way to remove them.
 *
 * One compact line on a phone, the full sentence from sm: up.
 *
 * This banner has now been through both failure modes. In a single row the
 * button's shrink-0 squeezed the copy into a one-word-per-line column, so
 * it was stacked instead; stacking fixed the wrapping and cost around a
 * hundred pixels, and the tester came back with the opposite complaint:
 * between this, the scorecard, the search and the filters there was
 * "barely the top half of the first deal card" left on a Galaxy S25.
 *
 * The way out of that trade is fewer words rather than a different
 * arrangement of the same ones. A phone gets the fact and the action, both
 * on one line. Nothing important is lost, because the point of the banner
 * is that these deals are fake and can be removed, and that survives.
 */
export function SampleBanner({ count }: { count: number }) {
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center gap-2 rounded-lg bg-black/[0.05] px-3 py-1.5 text-sm text-[var(--board-ink)] sm:gap-3 sm:py-2">
      <Sparkles className="size-4 shrink-0" />

      <p className="min-w-0 flex-1 truncate sm:whitespace-normal">
        {/* Short enough to fit beside the button on the narrowest phone. */}
        <span className="sm:hidden">{count} of these are examples</span>
        <span className="hidden sm:inline">
          {count} of these are examples so you can try things out. Drag them,
          open them, change them. Nothing here is real.
        </span>
      </p>

      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => await clearSamples())}
        className="flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-black/[0.08] px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-black/[0.14] disabled:opacity-60 sm:px-3 sm:py-1.5"
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <X className="size-3.5" />
        )}
        {/* "Clear" alone on a phone: the sparkle and the sentence beside it
            already say what is being cleared. */}
        <span className="sm:hidden">Clear</span>
        <span className="hidden sm:inline">Clear the examples</span>
      </button>
    </div>
  );
}
