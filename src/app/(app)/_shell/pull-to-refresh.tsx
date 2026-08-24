"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, Loader2 } from "lucide-react";

/** How far the finger travels before letting go actually refreshes. */
const THRESHOLD = 72;
/** Past this the pull stops following, so it cannot be dragged off screen. */
const MAX = 110;

/**
 * Pull down to reload the data.
 *
 * The app shell is overflow-hidden and every screen scrolls inside its own
 * container, so the browser's own pull-to-refresh has nothing to hook onto
 * and never fires. Installed to a home screen there is no address bar
 * either, which left no way to refresh at all.
 *
 * router.refresh() rather than location.reload(): it re-runs the server
 * components and swaps the data, keeping scroll position, open dialogs and
 * anything typed but unsaved. A full reload throws all of that away to
 * fetch the same rows.
 */
export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const host = useRef<HTMLDivElement | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, startRefresh] = useTransition();
  const router = useRouter();

  // The listeners are bound once, so the distance lives in a ref they can
  // both read and write. State exists only to draw it.
  const pullRef = useRef(0);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    // A mouse has a reload button. This is for the case that does not.
    if (!window.matchMedia("(pointer: coarse)").matches) return;

    let startY = 0;
    let scroller: Element | null = null;
    let active = false;

    /** The thing that actually scrolls under the finger, if anything does. */
    function scrollerFor(node: Node | null): Element | null {
      let n: Element | null =
        node instanceof Element ? node : (node?.parentElement ?? null);
      while (n && n !== el) {
        const oy = getComputedStyle(n).overflowY;
        if (
          (oy === "auto" || oy === "scroll") &&
          n.scrollHeight > n.clientHeight
        ) {
          return n;
        }
        n = n.parentElement;
      }
      return null;
    }

    function onStart(e: TouchEvent) {
      if (e.touches.length !== 1) return;
      startY = e.touches[0].clientY;
      scroller = scrollerFor(e.target as Node);
      // Only from the very top. Anywhere else the person is scrolling.
      active = !scroller || scroller.scrollTop <= 0;
    }

    /** One place that moves the value, so the ref and the render agree. */
    function set(next: number) {
      pullRef.current = next;
      setPull(next);
    }

    function onMove(e: TouchEvent) {
      if (!active) return;
      const dy = e.touches[0].clientY - startY;

      if (dy <= 0) {
        set(0);
        return;
      }
      if (scroller && scroller.scrollTop > 0) {
        active = false;
        set(0);
        return;
      }

      // Resistance, so it feels attached to something rather than free.
      const eased = Math.min(MAX, dy * 0.45);
      if (eased > 4) e.preventDefault();
      set(eased);
    }

    function onEnd() {
      if (pullRef.current >= THRESHOLD) {
        startRefresh(() => router.refresh());
      }
      active = false;
      set(0);
    }

    // passive: false so the browser does not scroll while we pull.
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    el.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [router]);

  const ready = pull >= THRESHOLD;
  const showing = pull > 4 || refreshing;

  return (
    <div ref={host} className="relative flex flex-1 flex-col overflow-hidden">
      {showing && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center"
          style={{ transform: `translateY(${refreshing ? 12 : pull - 28}px)` }}
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-white shadow-md">
            {refreshing ? (
              <Loader2 className="size-4 animate-spin text-[var(--brand)]" />
            ) : (
              <ArrowDown
                className={`size-4 text-[var(--brand)] transition-transform ${
                  ready ? "rotate-180" : ""
                }`}
              />
            )}
          </span>
        </div>
      )}

      <div
        className="flex flex-1 flex-col overflow-hidden"
        style={{
          // Always an explicit value, never undefined. Removing the
          // transform outright leaves the transition with nothing to
          // animate towards, and the content stayed pushed down after
          // every pull.
          transform: `translateY(${pull}px)`,
          transition: pull > 0 ? "none" : "transform 200ms ease-out",
        }}
      >
        {children}
      </div>

      <span aria-live="polite" className="sr-only">
        {refreshing ? "Refreshing" : ""}
      </span>
    </div>
  );
}
