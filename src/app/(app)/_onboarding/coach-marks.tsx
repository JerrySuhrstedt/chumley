"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * The two things a brand new user needs told, once.
 *
 * A tour that runs on a schedule of its own is the thing people close
 * without reading, so this is gated twice. It only appears while the board
 * still holds seeded cards and holds nothing the user added themselves,
 * which is true for exactly one visit and cannot become true again by
 * accident. And it records having run.
 *
 * The double gate matters more than it looks: the record lives in
 * localStorage, so clearing a browser or opening the app on a second device
 * would otherwise replay the tour at somebody six months in. The board's own
 * contents settle that, because by then they have real leads.
 *
 * Positions are measured rather than guessed. The board is a horizontally
 * scrolling column layout that reflows between phone and desktop, so any
 * hard-coded coordinate would be wrong on most screens.
 */

const SEEN_KEY = "chumley.coach.v1";

type Step = {
  target: string;
  title: string;
  body: string;
  cta: string;
};

const STEPS: Step[] = [
  {
    target: "sample-lead",
    title: "These are sample leads",
    body: "We put three on the board so it is not empty. Drag them, open them, delete them. Nothing here is real, so you cannot break anything.",
    cta: "Got it",
  },
  {
    target: "add-lead",
    title: "You can start adding leads right now",
    body: "A name and a phone number is all it takes. Everything else is optional, forever.",
    cta: "Start selling",
  },
];

type Box = { top: number; left: number; width: number; height: number };

/** The rectangle around every element matching a target, in page space. */
function boxFor(target: string): Box | null {
  const nodes = [
    ...document.querySelectorAll<HTMLElement>(`[data-coach="${target}"]`),
  ].filter((n) => n.offsetParent !== null);
  if (nodes.length === 0) return null;

  let top = Infinity,
    left = Infinity,
    right = -Infinity,
    bottom = -Infinity;
  for (const n of nodes) {
    const r = n.getBoundingClientRect();
    top = Math.min(top, r.top);
    left = Math.min(left, r.left);
    right = Math.max(right, r.right);
    bottom = Math.max(bottom, r.bottom);
  }
  return { top, left, width: right - left, height: bottom - top };
}

export function CoachMarks({ enabled }: { enabled: boolean }) {
  const [step, setStep] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [running, setRunning] = useState(false);

  /**
   * Start once the board has painted, so the first measurement lands on
   * elements where they will actually end up.
   *
   * There is deliberately no "have I already started" ref here. An earlier
   * version had one, and React invoking effects twice meant the second pass
   * saw the ref already set, returned early, and left the cleanup from the
   * first pass having cancelled the only timer. The tour simply never
   * appeared. Re-running this is harmless: it schedules the same timer
   * again, and once the run has finished the flag below stops it.
   */
  useEffect(() => {
    if (!enabled) return;
    if (localStorage.getItem(SEEN_KEY) === "1") return;
    const t = setTimeout(() => setRunning(true), 450);
    return () => clearTimeout(t);
  }, [enabled]);

  const measure = useCallback(() => {
    const current = STEPS[step];
    if (!current) return;
    setBox(boxFor(current.target));
  }, [step]);

  /**
   * Bring the target into view, then measure where it landed.
   *
   * Measured straight away as well as after the scroll settles. Waiting
   * only for the settle left the overlay with nothing to draw for most of a
   * second on every step change, and the previous version cleared the box
   * first, so the whole thing blinked out and back. It read as the tour
   * crashing. Now the old rectangle stays put until the new one is known
   * and the spotlight slides between them.
   */
  useEffect(() => {
    if (!running) return;
    const current = STEPS[step];
    if (!current) return;

    const first = document.querySelector<HTMLElement>(
      `[data-coach="${current.target}"]`
    );
    first?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });

    // Next frame rather than inline: measuring inside the effect body sets
    // state during the effect, and reading layout before paint would give
    // the position the target is leaving rather than the one it is taking.
    const raf = requestAnimationFrame(measure);
    const settled = setTimeout(measure, 350);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settled);
    };
  }, [running, step, measure]);

  useEffect(() => {
    if (!running) return;
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [running, measure]);

  const finish = useCallback(() => {
    localStorage.setItem(SEEN_KEY, "1");
    setRunning(false);
  }, []);

  const next = () => {
    if (step + 1 >= STEPS.length) {
      finish();
      return;
    }
    // The box is deliberately left alone. It is replaced by the next
    // measurement rather than cleared, so there is never a frame with
    // nothing to point at.
    setStep((s) => s + 1);
  };

  useEffect(() => {
    if (!running) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "Enter") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!running) return null;
  const current = STEPS[step];
  if (!current) return null;

  // Only true before the very first measurement. A target that never
  // appears is not worth pointing at, and skipping beats drawing an arrow
  // into empty space.
  if (!box) return null;

  const pad = 8;
  const hole = {
    top: box.top - pad,
    left: box.left - pad,
    width: box.width + pad * 2,
    height: box.height + pad * 2,
  };

  // Below the target where there is room underneath, above it otherwise.
  const bubbleW = Math.min(340, window.innerWidth - 32);
  const below = hole.top + hole.height + 190 < window.innerHeight;
  const bubbleTop = below ? hole.top + hole.height + 14 : hole.top - 14;
  const rawLeft = hole.left + hole.width / 2 - bubbleW / 2;
  const bubbleLeft = Math.max(16, Math.min(rawLeft, window.innerWidth - bubbleW - 16));
  const arrowLeft = Math.max(
    18,
    Math.min(hole.left + hole.width / 2 - bubbleLeft - 8, bubbleW - 34)
  );

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true">
      {/* One element does the dimming and the cutout together: an enormous
          spread shadow painted outward from a transparent rectangle. Four
          separate panels around the hole would seam visibly at the corners
          whenever the target moved. */}
      <div
        className="pointer-events-none absolute rounded-xl ring-4 ring-[var(--brand)] transition-all duration-300"
        style={{
          top: hole.top,
          left: hole.left,
          width: hole.width,
          height: hole.height,
          boxShadow: "0 0 0 9999px rgba(9, 30, 66, 0.62)",
        }}
      />

      {/* Anywhere off the target dismisses, which is what people try first. */}
      <button
        type="button"
        aria-label="Close the tour"
        onClick={finish}
        className="absolute inset-0 h-full w-full cursor-default"
      />

      <div
        className="absolute rounded-xl bg-white p-4 shadow-2xl transition-all duration-300"
        style={{
          top: bubbleTop,
          left: bubbleLeft,
          width: bubbleW,
          transform: below ? undefined : "translateY(-100%)",
        }}
      >
        <span
          aria-hidden
          className="absolute size-3 rotate-45 bg-white"
          style={{
            left: arrowLeft,
            ...(below ? { top: -6 } : { bottom: -6 }),
          }}
        />

        <p className="text-[15px] font-bold text-slate-900">{current.title}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
          {current.body}
        </p>

        <div className="mt-3.5 flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-slate-400">
            {step + 1} of {STEPS.length}
          </span>
          <div className="flex items-center gap-2">
            {step + 1 < STEPS.length && (
              <button
                type="button"
                onClick={finish}
                className="rounded-lg px-2.5 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100"
              >
                Skip
              </button>
            )}
            <button
              type="button"
              onClick={next}
              autoFocus
              className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[var(--brand-dark)]"
            >
              {current.cta}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
