"use client";

import { useTransition } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { clearSamples } from "./actions";

/**
 * Sits above the board until the demo deals are gone. It has to be
 * impossible to mistake three fake people for real ones, and impossible
 * not to find the way to remove them.
 */
export function SampleBanner({ count }: { count: number }) {
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-black/[0.05] px-3 py-2 text-sm text-[var(--board-ink)]">
      <Sparkles className="size-4 shrink-0" />
      <p className="min-w-0 flex-1">
        {count} of these are examples so you can try things out. Drag them,
        open them, change them. Nothing here is real.
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => await clearSamples())}
        className="flex shrink-0 items-center gap-1.5 rounded-md bg-black/[0.08] px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-black/[0.14] disabled:opacity-60"
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
