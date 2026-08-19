import { STAGES } from "../_leads/stages";

/**
 * A loading.tsx file makes Next wrap the page in a Suspense boundary, so
 * the shell paints while the data is still travelling.
 *
 * The distance to the database is fixed and cannot be optimised away, so
 * the thing to fix is the wait feeling like a blank screen. This paints the
 * board's real shape immediately: same columns, same widths, same header.
 */
export default function PipelineLoading() {
  return (
    <div className="flex flex-1 animate-pulse flex-col overflow-hidden">
      <div className="flex flex-col gap-3 px-4 pt-4 pb-2 md:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex gap-2 sm:gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[52px] w-28 rounded-lg bg-white/15" />
            ))}
          </div>
          <div className="h-10 w-full rounded-lg bg-white/25 md:h-9 md:max-w-xs md:flex-1" />
          <div className="h-9 w-28 rounded-md bg-white/25 md:ml-auto" />
        </div>

        <div className="flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-7 w-20 rounded-full bg-white/15" />
          ))}
        </div>
      </div>

      <div className="flex flex-1 items-start gap-3 overflow-hidden px-4 pt-1.5 pb-5 md:px-6">
        {STAGES.map((stage, column) => (
          <div
            key={stage.value}
            className="hidden w-72 shrink-0 flex-col gap-2 rounded-xl bg-[var(--board-column)] p-2 first:flex md:flex"
          >
            <div className="flex items-center justify-between px-1 pt-1 pb-1">
              <div className="h-4 w-24 rounded bg-black/10" />
              <div className="h-3 w-8 rounded bg-black/10" />
            </div>

            {/* Fewer cards further right, the way a real pipeline narrows. */}
            {Array.from({ length: Math.max(1, 3 - column) }).map((_, i) => (
              <div key={i} className="rounded-lg bg-white p-3 shadow-sm">
                <div className="h-4 w-24 rounded bg-black/10" />
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="size-7 rounded-full bg-black/10" />
                  <div className="flex-1">
                    <div className="h-3 w-20 rounded bg-black/10" />
                    <div className="mt-1.5 h-2.5 w-28 rounded bg-black/5" />
                  </div>
                </div>
                <div className="mt-2.5 flex gap-1">
                  {[0, 1, 2].map((b) => (
                    <div key={b} className="h-8 flex-1 rounded-md bg-black/5" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
