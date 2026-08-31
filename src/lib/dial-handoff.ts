/**
 * Deciding whether a tap on Call actually became a phone call.
 *
 * Reported by Joudi Mohammad on a Galaxy S25 (CL-1): auto-logging was
 * "completely non-deterministic". Switching apps for under thirty seconds
 * produced a logged call; backgrounding cleanly for a minute produced
 * nothing. Both are true, and both come from the same two mistakes.
 *
 * MISTAKE ONE: setTimeout was used to measure how long the rep was away.
 * A backgrounded tab has its timers throttled and, on Android under memory
 * pressure, frozen outright. So the clock that was supposed to tell a real
 * call from an app switch simply stopped running during the only period it
 * needed to measure. Wall-clock arithmetic on Date.now() is used instead:
 * it is correct whether or not the page was ever suspended.
 *
 * MISTAKE TWO, and the one that put fiction in the database: the activity
 * row was written the instant focus left, and deleted afterwards if the rep
 * came back too quickly. When Gecko discarded the page while it was in the
 * background, the delete never ran. The write had already happened, so a
 * call that was never placed stayed on the lead's timeline forever. Nothing
 * is written now until the outcome is known.
 *
 * What is honest about this: a browser cannot see a dialer. It can see that
 * something took the screen, and for how long. So the signal is a hide that
 * follows the tap closely enough to be caused by it, followed by an absence
 * long enough to have held a conversation. Anything else asks the rep, who
 * knows.
 */

/** A hide later than this had some other cause. Dialers take over at once. */
const HANDOFF_WINDOW_MS = 6_000;

/** Shorter than this and nobody said hello, let alone anything after it. */
const MIN_CALL_MS = 12_000;

/** Focus never left, so nothing on this machine answered. */
const NO_HANDOFF_MS = 8_000;

export type DialOutcome =
  /** Away long enough that a call plausibly happened. */
  | "dialed"
  /** Something took over, but they were back too fast for it to be a call. */
  | "too-short"
  /** Nothing ever took the screen. No dialer, or the prompt was refused. */
  | "no-handoff";

/**
 * Watch one tap on Call and report what became of it, exactly once.
 *
 * Returns a cancel function. After cancelling, nothing fires.
 */
export function observeDial(
  onOutcome: (outcome: DialOutcome, awayMs: number) => void,
  now: () => number = Date.now,
): () => void {
  const tappedAt = now();
  let hiddenAt: number | null = null;
  let settled = false;

  const settle = (outcome: DialOutcome, awayMs: number) => {
    if (settled) return;
    settled = true;
    cleanup();
    onOutcome(outcome, awayMs);
  };

  const onHide = () => {
    if (hiddenAt !== null) return;
    // A hide long after the tap belongs to whatever the rep did next, not
    // to the dial. Leaving it unsettled lets the no-handoff timer speak.
    if (now() - tappedAt > HANDOFF_WINDOW_MS) return;
    hiddenAt = now();
  };

  const onShow = () => {
    if (hiddenAt === null) return;
    const awayMs = now() - hiddenAt;
    settle(awayMs >= MIN_CALL_MS ? "dialed" : "too-short", awayMs);
  };

  const onVisibility = () => {
    if (document.visibilityState === "hidden") onHide();
    else onShow();
  };

  /**
   * The only timer left, and it only has to survive a visible page, which
   * is precisely when timers are reliable. It is cleared the moment the
   * page hides, so it can never fire against a suspended tab and call a
   * real handoff a miss.
   */
  let idle: ReturnType<typeof setTimeout> | null = setTimeout(() => {
    if (hiddenAt === null) settle("no-handoff", 0);
  }, NO_HANDOFF_MS);

  const clearIdle = () => {
    if (idle !== null) {
      clearTimeout(idle);
      idle = null;
    }
  };

  const onBlur = () => {
    onHide();
    clearIdle();
  };
  const onFocus = () => onShow();

  function cleanup() {
    clearIdle();
    window.removeEventListener("blur", onBlur);
    window.removeEventListener("focus", onFocus);
    window.removeEventListener("pagehide", onBlur);
    window.removeEventListener("pageshow", onFocus);
    document.removeEventListener("visibilitychange", onVisibility);
  }

  window.addEventListener("blur", onBlur);
  window.addEventListener("focus", onFocus);
  window.addEventListener("pagehide", onBlur);
  window.addEventListener("pageshow", onFocus);
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    settled = true;
    cleanup();
  };
}

/** Exported for the tests, so the thresholds cannot drift silently. */
export const DIAL_TIMINGS = {
  HANDOFF_WINDOW_MS,
  MIN_CALL_MS,
  NO_HANDOFF_MS,
};

/**
 * Remembering that this browser refused to open a dialer.
 *
 * Reported as CL-2: deny Firefox's external-app prompt once and every
 * later tap on Call hangs. It is not literally a hang, it is an eight
 * second wait for a handoff that Firefox has already decided will never
 * happen, repeated on every tap, with nothing on screen to explain it.
 *
 * A refusal is a fact about the browser, not about the lead, so it is
 * remembered for the session and every card benefits. sessionStorage
 * rather than a module variable so it survives a navigation, and rather
 * than localStorage so it does not outlive the reason: the rep may well
 * grant the permission on their next visit, and starting the next session
 * by assuming the worst would be its own bug.
 */
const REFUSED_KEY = "chumley-dial-refused";

export function noteDialRefused(): void {
  try {
    sessionStorage.setItem(REFUSED_KEY, "1");
  } catch {
    // Private mode, or storage disabled. The cost is the eight second wait
    // returning, which is where we started, so there is nothing to do.
  }
}

export function dialWasRefused(): boolean {
  try {
    return sessionStorage.getItem(REFUSED_KEY) === "1";
  } catch {
    return false;
  }
}

/** After the rep fixes their browser settings, so Call stops assuming. */
export function clearDialRefused(): void {
  try {
    sessionStorage.removeItem(REFUSED_KEY);
  } catch {
    /* nothing to clear */
  }
}
