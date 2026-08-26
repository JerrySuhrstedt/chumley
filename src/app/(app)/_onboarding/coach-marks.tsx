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
    title: "This is a sample lead",
    body: "There are three of these across the board so it is not empty. Drag them, open them, delete them. None of it is real, so you cannot break anything.",
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

/**
 * The rectangle around the first visible element matching a target.
 *
 * It used to take the union of every match, which was wrong for the one
 * step that has more than one. The three sample leads are seeded into three
 * different stages, so on a kanban board they sit in three separate columns
 * and the union of them is a rectangle spanning the entire board. The
 * spotlight highlighted everything, which is the same as highlighting
 * nothing, and the arrow pointed at the middle of the screen.
 *
 * One target, pointed at properly. The copy carries the fact that there are
 * three of them, which is what the union was clumsily trying to say.
 */
export function boxFor(target: string): Box | null {
  const node = [
    ...document.querySelectorAll<HTMLElement>(`[data-coach="${target}"]`),
  ].find((n) => n.offsetParent !== null);
  if (!node) return null;

  const r = node.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

/**
 * Where the bubble goes, given the hole and the viewport.
 *
 * Pulled out as a pure function because it is arithmetic with edge cases,
 * and edge cases in arithmetic are worth testing rather than eyeballing on
 * one screen size.
 *
 * Centred under the target normally. But the "Add a lead" button sits hard
 * against the right of the header, and a centred bubble there gets shoved
 * back by the edge clamp until the arrow is nowhere near the button it is
 * supposed to be indicating.
 *
 * So a target in the right third has its bubble's right edge aligned to the
 * target's, which reads as hanging off the button. Left-aligning was the
 * first attempt and the tests threw it out: a 340px bubble starting at a
 * button 190px from the edge does not fit, so the clamp dragged it back to
 * exactly where centring had put it, and nothing changed.
 */
export function placeBubble(
  hole: Box,
  viewport: { width: number; height: number }
): { left: number; top: number; width: number; below: boolean; arrowLeft: number } {
  const margin = 16;
  const width = Math.min(340, viewport.width - margin * 2);

  const below = hole.top + hole.height + 190 < viewport.height;
  const top = below ? hole.top + hole.height + 14 : hole.top - 14;

  const centre = hole.left + hole.width / 2;
  const rightThird = centre > viewport.width * 0.62;

  // Right-hand targets hang off the target's right edge; everything else
  // centres underneath.
  const raw = rightThird
    ? hole.left + hole.width - width
    : centre - width / 2;
  const left = Math.max(margin, Math.min(raw, viewport.width - width - margin));

  // The arrow tracks the target even after the bubble has been clamped, so
  // it always points at the thing rather than at the middle of the bubble.
  const arrowLeft = Math.max(18, Math.min(centre - left - 8, width - 34));

  return { left, top, width, below, arrowLeft };
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
   * Bring the target into view, then keep measuring until it stops moving.
   *
   * The scroll is instant rather than smooth, and the measuring runs every
   * frame for up to a second instead of at two fixed moments. Both changes
   * are for the same reason: the board scrolls horizontally inside its own
   * container, and a smooth scroll measured on a 350ms timer is a race. Land
   * early and the rectangle describes where the target was passing through,
   * which is how a spotlight ends up over empty board.
   *
   * The overlay keeps its CSS transition, so the highlight still glides
   * between steps. It just glides to somewhere correct.
   */
  useEffect(() => {
    if (!running) return;
    const current = STEPS[step];
    if (!current) return;

    const first = document.querySelector<HTMLElement>(
      `[data-coach="${current.target}"]`
    );
    first?.scrollIntoView({ behavior: "auto", block: "center", inline: "center" });

    let raf = 0;
    let stable = 0;
    let last = "";
    const started = Date.now();

    const tick = () => {
      const box = boxFor(current.target);
      const key = box ? `${box.top},${box.left},${box.width},${box.height}` : "";
      if (box) setBox(box);

      // Three identical frames is settled. Give up after a second rather
      // than spin forever on something genuinely animating.
      stable = key && key === last ? stable + 1 : 0;
      last = key;
      if (stable < 3 && Date.now() - started < 1000) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, step]);

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

  // The visual viewport where the browser exposes it: on a phone that is
  // the area actually visible above the keyboard and below the URL bar,
  // which is what the bubble has to fit inside.
  const vv = window.visualViewport;
  const {
    left: bubbleLeft,
    top: bubbleTop,
    width: bubbleW,
    below,
    arrowLeft,
  } = placeBubble(hole, {
    width: vv?.width ?? window.innerWidth,
    height: vv?.height ?? window.innerHeight,
  });

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
