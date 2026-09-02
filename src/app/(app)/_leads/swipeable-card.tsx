"use client";

import { useEffect, useRef, useState } from "react";
import { useDndContext } from "@dnd-kit/core";
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
  children: React.ReactNode;
}) {
  const [dx, setDx] = useState(0);
  const [settling, setSettling] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const locked = useRef<"none" | "x" | "y">("none");

  /**
   * Whether dnd-kit owns the current gesture, readable from inside the
   * touch handlers.
   *
   * BT-54: press-hold a card for 250ms and the board's TouchSensor starts
   * a drag, but these touch handlers kept tracking the same finger. The
   * swipe threshold and the drop each moved the lead one stage, so one
   * gesture advanced it two. A drag can only activate while the finger has
   * moved less than the sensor's 8px tolerance, which is also less than
   * this component's own lock threshold, so standing down the moment a
   * drag is live is enough: the swipe never locks and never fires.
   */
  const { active } = useDndContext();
  const dragOwns = useRef(false);
  useEffect(() => {
    dragOwns.current = active !== null;
  }, [active]);

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY };
    locked.current = "none";
    setSettling(false);
  }

  function onTouchMove(e: React.TouchEvent) {
    if (dragOwns.current) return;
    if (!start.current) return;
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
    if (dragOwns.current) {
      // The drag's drop already decided where the card goes. Anything this
      // handler did on top of that would be the double-move.
      setDx(0);
      start.current = null;
      locked.current = "none";
      return;
    }
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

  const past = Math.abs(dx) > THRESHOLD;
  const revealing = dx > 0 ? "forward" : dx < 0 ? "archive" : null;

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
        style={{ transform: dx ? `translateX(${dx}px)` : undefined }}
        className={`relative ${settling ? "transition-transform duration-200" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}
