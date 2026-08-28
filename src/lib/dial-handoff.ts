/**
 * Watch whether anything on this machine answered a tel: hand-off.
 *
 * No browser API answers "is a dialer installed?". What every dialer does
 * do is take over: the window blurs or the page hides within a beat of the
 * click. Silence with focus retained means nothing answered, and the rep is
 * looking at a page that did nothing.
 *
 * The distinction matters because dialling writes the activity row. A
 * hand-off that visibly happened is a call worth recording; a hand-off
 * that went nowhere must not be, or the timeline records calls that were
 * never placed.
 *
 * Calls back exactly once: taken=true the moment focus leaves, taken=false
 * after `timeoutMs` with focus retained. This is a heuristic, and its
 * failure modes are chosen deliberately. A dialer that somehow keeps focus
 * reads as silence, which shows the rep the number instead of logging
 * behind their back. A rep who alt-tabs away inside the window reads as a
 * hand-off, same as today's behavior.
 *
 * Returns a cancel function for unmount; after cancel, no callback fires.
 */
export function watchDialHandoff(
  onResult: (taken: boolean) => void,
  timeoutMs = 1500
): () => void {
  let settled = false;

  const settle = (taken: boolean) => {
    if (settled) return;
    settled = true;
    cleanup();
    onResult(taken);
  };

  const onLeave = () => settle(true);
  const onVisibility = () => {
    // Mobile keeps the window "focused" while the dialer covers the page,
    // so visibility is the signal there rather than blur.
    if (document.visibilityState === "hidden") settle(true);
  };
  const timer = setTimeout(() => settle(false), timeoutMs);

  function cleanup() {
    clearTimeout(timer);
    window.removeEventListener("blur", onLeave);
    window.removeEventListener("pagehide", onLeave);
    document.removeEventListener("visibilitychange", onVisibility);
  }

  window.addEventListener("blur", onLeave);
  window.addEventListener("pagehide", onLeave);
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    settled = true;
    cleanup();
  };
}

/**
 * Watch whether the rep comes straight back after a hand-off.
 *
 * A hand-off only proves a dialer opened, not that a call happened. The
 * tell for a cancelled call is speed: cancel and you are back in the
 * browser inside a few seconds, while a call that connected holds the rep
 * for longer, or they return mid-call and can answer for themselves.
 *
 * Calls back exactly once: returned=true if focus is back within
 * `timeoutMs` (including already back by the time this attaches, which
 * happens when the cancel beats the server round-trip), returned=false
 * once the window passes. Returns a cancel function for unmount.
 */
export function watchFocusReturn(
  onResult: (returned: boolean) => void,
  timeoutMs = 10_000
): () => void {
  let settled = false;

  const settle = (returned: boolean) => {
    if (settled) return;
    settled = true;
    cleanup();
    onResult(returned);
  };

  const onBack = () => settle(true);
  const onVisibility = () => {
    if (document.visibilityState === "visible") settle(true);
  };
  const timer = setTimeout(() => settle(false), timeoutMs);

  function cleanup() {
    clearTimeout(timer);
    window.removeEventListener("focus", onBack);
    document.removeEventListener("visibilitychange", onVisibility);
  }

  window.addEventListener("focus", onBack);
  document.addEventListener("visibilitychange", onVisibility);

  if (document.hasFocus() && document.visibilityState === "visible") {
    // Queued so the caller's cancel function exists before the callback.
    setTimeout(() => settle(true), 0);
  }

  return () => {
    settled = true;
    cleanup();
  };
}
