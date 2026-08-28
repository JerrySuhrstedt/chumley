// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { watchDialHandoff, watchFocusReturn } from "@/lib/dial-handoff";

/**
 * What a tap on Call is allowed to record.
 *
 * The bug this locks down: on a machine with no tel: handler, clicking
 * Call did nothing visible while the app logged a call anyway. The rep saw
 * silence, the timeline gained a call that was never placed. The watcher's
 * one job is to tell those two worlds apart, and to say so exactly once.
 */

function setVisibility(state: "hidden" | "visible") {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("watchDialHandoff", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    setVisibility("visible");
  });

  it("reports taken when the window blurs, and only once", () => {
    const onResult = vi.fn();
    watchDialHandoff(onResult, 1500);

    window.dispatchEvent(new Event("blur"));
    expect(onResult).toHaveBeenCalledExactlyOnceWith(true);

    // Neither a second blur nor the expiring timer may speak again.
    window.dispatchEvent(new Event("blur"));
    vi.advanceTimersByTime(2000);
    expect(onResult).toHaveBeenCalledTimes(1);
  });

  it("reports taken when the page hides, which is the mobile signal", () => {
    const onResult = vi.fn();
    watchDialHandoff(onResult, 1500);

    setVisibility("hidden");
    expect(onResult).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("ignores visibility events while the page stays visible", () => {
    const onResult = vi.fn();
    watchDialHandoff(onResult, 1500);

    setVisibility("visible");
    expect(onResult).not.toHaveBeenCalled();
  });

  it("reports silence once the timeout passes with focus retained", () => {
    const onResult = vi.fn();
    watchDialHandoff(onResult, 1500);

    vi.advanceTimersByTime(1499);
    expect(onResult).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onResult).toHaveBeenCalledExactlyOnceWith(false);

    // A late blur, the rep wandering off to another window, stays quiet.
    window.dispatchEvent(new Event("blur"));
    expect(onResult).toHaveBeenCalledTimes(1);
  });

  it("never calls back after cancel", () => {
    const onResult = vi.fn();
    const cancel = watchDialHandoff(onResult, 1500);

    cancel();
    window.dispatchEvent(new Event("blur"));
    vi.advanceTimersByTime(2000);
    expect(onResult).not.toHaveBeenCalled();
  });
});

/**
 * The second half of the same question. A hand-off proves a dialer opened,
 * not that a call connected; the tell for a cancelled call is coming back
 * to the browser within seconds. This watcher turns that speed into an
 * answer, so the toast can ask instead of assert.
 */
describe("watchFocusReturn", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(document, "hasFocus").mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    setVisibility("visible");
  });

  it("reports a return when focus comes back inside the window", () => {
    const onResult = vi.fn();
    watchFocusReturn(onResult, 10_000);

    vi.advanceTimersByTime(3000);
    window.dispatchEvent(new Event("focus"));
    expect(onResult).toHaveBeenCalledExactlyOnceWith(true);

    vi.advanceTimersByTime(20_000);
    expect(onResult).toHaveBeenCalledTimes(1);
  });

  it("reports a return when the page becomes visible again", () => {
    const onResult = vi.fn();
    watchFocusReturn(onResult, 10_000);

    setVisibility("visible");
    expect(onResult).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("reports immediately when focus is already back at attach", () => {
    // A fast cancel beats the logging round-trip, so the watcher starts
    // with the rep already returned and must not wait out the timeout.
    vi.spyOn(document, "hasFocus").mockReturnValue(true);
    const onResult = vi.fn();
    watchFocusReturn(onResult, 10_000);

    vi.advanceTimersByTime(0);
    expect(onResult).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("reports no return once the window passes", () => {
    const onResult = vi.fn();
    watchFocusReturn(onResult, 10_000);

    vi.advanceTimersByTime(10_000);
    expect(onResult).toHaveBeenCalledExactlyOnceWith(false);

    window.dispatchEvent(new Event("focus"));
    expect(onResult).toHaveBeenCalledTimes(1);
  });

  it("never calls back after cancel, even when already focused", () => {
    vi.spyOn(document, "hasFocus").mockReturnValue(true);
    const onResult = vi.fn();
    const cancel = watchFocusReturn(onResult, 10_000);

    cancel();
    vi.advanceTimersByTime(20_000);
    expect(onResult).not.toHaveBeenCalled();
  });
});
