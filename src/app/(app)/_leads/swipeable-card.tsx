"use client";

import { useRef, useState } from "react";
import { Archive, ArrowLeft, ArrowRight } from "lucide-react";
import type { LeadStage } from "./actions";

/** How far a thumb has to travel before it counts as a decision. */
const THRESHOLD = 90;

/**
 * Swipe a card on a phone: right to move it forward a bucket, left to step
 * it off the board.
 *
 * Left is deliberately not "Lost". Marking a deal lost is a claim about the
 * deal; taking it off the board is a claim about your attention. A thumb
 * should only be able to make the second one by accident, and even that is
 * undoable from the toast.
 *
 * Vertical drags are handed straight back to the scroller, so the list still
 * scrolls normally.
 */
export function SwipeableCard({
  forward,
  back,
  onForward,
  onBack,
  onArchive,
  dragActive = false,
  children,
}: {
  /** The bucket a right swipe advances to, or null at the end of the line. */
  forward: LeadStage | null;
  /**
   * The bucket a left swipe returns to. Null only in the first bucket,
   * where there is nothing behind it and coming off the board is what
   * swiping back actually means.
   */
  back: LeadStage | null;
  onForward: () => void;
  onBack: () => void;
  onArchive: () => void;
  /**
   * True once the dnd TouchSensor has claimed a drag anywhere on the board.
   * The swipe and the drag both listen to the same finger, so while a drag
   * is live this card stops tracking its own swipe: without it, resting long
   * enough to start a drag and then moving sideways both dragged the card
   * and swiped it, firing two stage changes from one gesture.
   */
  dragActive?: boolean;
  children: React.ReactNode;
}) {
  const [dx, setDx] = useState(0);
  const [settling, setSettling] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const locked = useRef<"none" | "x" | "y">("none");

  function onTouchStart(e: React.TouchEvent) {
    if (dragActive) return;
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY };
    locked.current = "none";
    setSettling(false);
  }

  function onTouchMove(e: React.TouchEvent) {
    if (dragActive || !start.current) return;
    const t = e.touches[0];
    const moveX = t.clientX - start.current.x;
    const moveY = t.clientY - start.current.y;

    // Decide once whether this is a scroll or a swipe, then stick with it.
    if (locked.current === "none") {
      if (Math.abs(moveX) < 8 && Math.abs(moveY) < 8) return;
      locked.current = Math.abs(moveX) > Math.abs(moveY) ? "x" : "y";
    }
    if (locked.current === "y") return;

    // Nothing to advance into at the end of the board, so resist that way.
    const limited = moveX > 0 && !forward ? moveX * 0.25 : moveX;
    setDx(limited);
  }

  function onTouchEnd() {
    // A drag took over this gesture. The handlers all bail on dragActive
    // and the offset is forced to rest in render, so there is nothing to
    // reset here; the next touch starts clean.
    if (dragActive) return;
    if (locked.current === "x") {
      if (dx > THRESHOLD && forward) {
        onForward();
      } else if (dx < -THRESHOLD) {
        // A bucket behind means step back into it. Only the first bucket
        // has nothing behind it, and there coming off the board is what
        // swiping back honestly means.
        if (back) onBack();
        else onArchive();
      }
    }
    setSettling(true);
    setDx(0);
    start.current = null;
    locked.current = "none";
  }

  // While a drag has claimed the gesture the card rests: the swipe is
  // abandoned and onTouchEnd bails, so any dx left from the instant before
  // the drag took over is not shown. Deriving this beats resetting state in
  // an effect, which the finger-vs-drag race made tempting.
  const offset = dragActive ? 0 : dx;
  const past = Math.abs(offset) > THRESHOLD;
  const revealing = offset > 0 ? "forward" : offset < 0 ? "archive" : null;

  return (
    <div className="relative touch-pan-y md:touch-auto">
      {/* What the swipe will do, revealed behind the card as it moves. */}
      {revealing && (
        <div
          className={`absolute inset-0 flex items-center rounded-lg px-4 text-sm font-semibold text-white ${
            revealing === "forward"
              ? "justify-start bg-[var(--label-upcoming)]"
              : back
                ? "justify-end bg-[var(--label-overdue)]"
                : "justify-end bg-[var(--board-ink-muted)]"
          } ${past ? "opacity-100" : "opacity-70"}`}
        >
          {revealing === "forward" ? (
            <span className="flex items-center gap-1.5">
              <ArrowRight className="size-4" />
              Move forward
            </span>
          ) : back ? (
            <span className="flex items-center gap-1.5">
              <ArrowLeft className="size-4" />
              Move back
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              Off the board
              <Archive className="size-4" />
            </span>
          )}
        </div>
      )}

      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        style={{ transform: offset ? `translateX(${offset}px)` : undefined }}
        className={`relative ${settling && !dragActive ? "transition-transform duration-200" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}
