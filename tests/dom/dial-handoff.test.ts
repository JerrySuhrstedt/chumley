// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  observeDial,
  DIAL_TIMINGS,
  noteDialRefused,
  dialWasRefused,
  clearDialRefused,
  type DialOutcome,
} from "@/lib/dial-handoff";

/**
 * What a tap on Call is allowed to record.
 *
 * The original bug: on a machine with no tel: handler, clicking Call did
 * nothing visible while the app logged a call anyway.
 *
 * Then CL-1, reported by Joudi Mohammad on a Galaxy S25: the same watcher
 * logged calls for thirty-second app switches and missed real ones after a
 * minute in the background. Both came from measuring time with setTimeout,
 * which a suspended tab stops running, so the tests below drive a fake
 * clock rather than waiting on real timers.
 */

function setVisibility(state: "hidden" | "visible") {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

/** A clock the test moves by hand, the way an OS moves it during a suspend. */
function fakeClock(start = 1_000_000) {
  let t = start;
  return {
    now: () => t,
    advance: (ms: number) => {
      t += ms;
    },
  };
}

describe("observeDial", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setVisibility("visible");
  });
  afterEach(() => {
    vi.useRealTimers();
    setVisibility("visible");
  });

  it("reports a call when the rep was away long enough to have had one", () => {
    const clock = fakeClock();
    const seen: DialOutcome[] = [];
    observeDial((o) => seen.push(o), clock.now);

    clock.advance(400); // the dialer takes over almost at once
    setVisibility("hidden");
    clock.advance(45_000); // a conversation
    setVisibility("visible");

    expect(seen).toEqual(["dialed"]);
  });

  it("does not report a call for a brief app switch", () => {
    // The reported false positive: "leaving Firefox for under 30 seconds
    // while opening other apps forces a Call logged status".
    const clock = fakeClock();
    const seen: [DialOutcome, number][] = [];
    observeDial((o, ms) => seen.push([o, ms]), clock.now);

    clock.advance(500);
    setVisibility("hidden");
    clock.advance(4_000);
    setVisibility("visible");

    expect(seen).toEqual([["too-short", 4_000]]);
  });

  it("survives a suspended tab, where timers do not run", () => {
    // The reported false negative: backgrounding cleanly for a minute
    // failed to log. Timers are frozen while hidden, so the outcome has to
    // come from wall-clock arithmetic on resume, not from a timeout.
    const clock = fakeClock();
    const seen: DialOutcome[] = [];
    observeDial((o) => seen.push(o), clock.now);

    clock.advance(300);
    setVisibility("hidden");
    // No timers fire at all here: this is the whole point.
    clock.advance(90_000);
    setVisibility("visible");

    expect(seen).toEqual(["dialed"]);
  });

  it("ignores a hide that came too long after the tap", () => {
    // Somebody tapped Call, nothing happened, and a minute later they
    // switched apps for their own reasons. That is not a dial.
    const clock = fakeClock();
    const seen: DialOutcome[] = [];
    observeDial((o) => seen.push(o), clock.now);

    clock.advance(DIAL_TIMINGS.HANDOFF_WINDOW_MS + 1_000);
    setVisibility("hidden");
    clock.advance(60_000);
    setVisibility("visible");

    expect(seen).toEqual([]);
  });

  it("reports no handoff when nothing ever takes the screen", () => {
    const clock = fakeClock();
    const seen: DialOutcome[] = [];
    observeDial((o) => seen.push(o), clock.now);

    vi.advanceTimersByTime(DIAL_TIMINGS.NO_HANDOFF_MS + 100);

    expect(seen).toEqual(["no-handoff"]);
  });

  it("settles exactly once, however many events arrive", () => {
    const clock = fakeClock();
    const seen: DialOutcome[] = [];
    observeDial((o) => seen.push(o), clock.now);

    clock.advance(200);
    setVisibility("hidden");
    window.dispatchEvent(new Event("blur"));
    clock.advance(30_000);
    setVisibility("visible");
    window.dispatchEvent(new Event("focus"));
    setVisibility("hidden");
    setVisibility("visible");

    expect(seen).toEqual(["dialed"]);
  });

  it("says nothing at all after it is cancelled", () => {
    const clock = fakeClock();
    const seen: DialOutcome[] = [];
    const cancel = observeDial((o) => seen.push(o), clock.now);

    cancel();
    clock.advance(300);
    setVisibility("hidden");
    clock.advance(60_000);
    setVisibility("visible");
    vi.advanceTimersByTime(30_000);

    expect(seen).toEqual([]);
  });

  it("nudges early when nothing has taken the screen (JM-21)", () => {
    // Ten silent seconds before the fallback read as a frozen app. The
    // nudge fires well under a second so the number goes up immediately.
    const clock = fakeClock();
    const seen: DialOutcome[] = [];
    let nudged = 0;
    observeDial((o) => seen.push(o), clock.now, () => nudged++);

    vi.advanceTimersByTime(DIAL_TIMINGS.SLOW_DIALER_MS + 50);
    expect(nudged).toBe(1);
    // Advisory, not a verdict: the watch is still running.
    expect(seen).toEqual([]);

    vi.advanceTimersByTime(DIAL_TIMINGS.NO_HANDOFF_MS);
    expect(seen).toEqual(["no-handoff"]);
    expect(nudged).toBe(1);
  });

  it("does not nudge when the dialer takes over promptly", () => {
    const clock = fakeClock();
    const seen: DialOutcome[] = [];
    let nudged = 0;
    observeDial((o) => seen.push(o), clock.now, () => nudged++);

    clock.advance(300);
    setVisibility("hidden");
    vi.advanceTimersByTime(DIAL_TIMINGS.SLOW_DIALER_MS + 1_000);
    clock.advance(45_000);
    setVisibility("visible");

    expect(nudged).toBe(0);
    expect(seen).toEqual(["dialed"]);
  });

  it("still settles a real call after the nudge has fired", () => {
    // A slow dialer: the fallback goes up at 600ms, the dialer opens at
    // two seconds anyway, and the call must still log itself.
    const clock = fakeClock();
    const seen: DialOutcome[] = [];
    let nudged = 0;
    observeDial((o) => seen.push(o), clock.now, () => nudged++);

    vi.advanceTimersByTime(DIAL_TIMINGS.SLOW_DIALER_MS + 50);
    expect(nudged).toBe(1);

    clock.advance(2_000);
    setVisibility("hidden");
    clock.advance(45_000);
    setVisibility("visible");

    expect(seen).toEqual(["dialed"]);
  });

  it("never nudges after being cancelled", () => {
    const clock = fakeClock();
    let nudged = 0;
    const cancel = observeDial(() => {}, clock.now, () => nudged++);

    cancel();
    vi.advanceTimersByTime(DIAL_TIMINGS.SLOW_DIALER_MS + 1_000);

    expect(nudged).toBe(0);
  });

  it("treats the boundary as not-a-call, so the rep is asked", () => {
    // A guess either way is wrong here, and the cost is asymmetric: a
    // missed log costs one tap, a false log puts fiction on the record.
    const clock = fakeClock();
    const seen: DialOutcome[] = [];
    observeDial((o) => seen.push(o), clock.now);

    clock.advance(300);
    setVisibility("hidden");
    clock.advance(DIAL_TIMINGS.MIN_CALL_MS - 1);
    setVisibility("visible");

    expect(seen).toEqual(["too-short"]);
  });
});

/**
 * CL-2, reported by Joudi Mohammad: deny Firefox's external-app prompt for
 * tel: once and every later tap on Call "hangs", with "zero prompt to
 * reset browser permissions".
 *
 * It was never a hang. It was an eight-second wait for a handoff the
 * browser had already decided would never happen, repeated on every tap,
 * with only a toast at the end of it.
 */
describe("remembering a refused dialer", () => {
  beforeEach(() => clearDialRefused());
  afterEach(() => clearDialRefused());

  it("starts out assuming the dialer works", () => {
    expect(dialWasRefused()).toBe(false);
  });

  it("remembers a refusal so the next tap does not wait again", () => {
    noteDialRefused();
    expect(dialWasRefused()).toBe(true);
  });

  it("forgets on request, so a fixed permission is not assumed broken", () => {
    // Closing the fallback dialog clears this. Somebody who just went and
    // allowed the permission must get a real attempt on their next tap.
    noteDialRefused();
    clearDialRefused();
    expect(dialWasRefused()).toBe(false);
  });

  it("survives storage being unavailable", () => {
    // Private mode throws on sessionStorage. The cost of failing here is
    // the eight second wait coming back, which is merely where we started,
    // so it must never throw into the click handler.
    const original = Object.getOwnPropertyDescriptor(window, "sessionStorage");
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      get() {
        throw new Error("denied");
      },
    });
    expect(() => noteDialRefused()).not.toThrow();
    expect(dialWasRefused()).toBe(false);
    expect(() => clearDialRefused()).not.toThrow();
    if (original) Object.defineProperty(window, "sessionStorage", original);
  });
});
