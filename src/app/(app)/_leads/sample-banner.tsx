"use client";

import { useTransition } from "react";
import { Sparkles, X } from "lucide-react";
import { clearSamples } from "./actions";

/**
 * Sits above the board until the demo deals are gone. It has to be
 * impossible to mistake three fake people for real ones, and impossible
 * not to find the way to remove them.
 */
export function SampleBanner({ count }: { count: number }) {
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white/15 px-3 py-2 text-sm text-white backdrop-blur-sm">
      <Sparkles className="size-4 shrink-0" />
      <p className="min-w-0 flex-1">
        {count} of these are examples so you can try things out. Drag them,
        open them, change them. Nothing here is real.
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => await clearSamples())}
        className="flex shrink-0 items-center gap-1.5 rounded-md bg-white/20 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/30 disabled:opacity-60"
      >
        <X className="size-3.5" />
        {pending ? "Clearing..." : "Clear the examples"}
      </button>
    </div>
  );
}
