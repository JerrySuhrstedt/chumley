// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { canDial } from "@/lib/device";

/**
 * Capability is a property of the device, decided from the device. The
 * bug this locks down: a phone whose browser delayed the hand-off signal
 * was told it was a computer with no dialer.
 */

function setNavigator(fields: {
  userAgent?: string;
  platform?: string;
  maxTouchPoints?: number;
}) {
  for (const [key, value] of Object.entries(fields)) {
    Object.defineProperty(navigator, key, {
      configurable: true,
      get: () => value,
    });
  }
}

const DESKTOP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

afterEach(() => {
  vi.restoreAllMocks();
  setNavigator({ userAgent: DESKTOP_UA, platform: "Win32", maxTouchPoints: 0 });
});

describe("canDial", () => {
  it("says yes on Android, Firefox included", () => {
    setNavigator({
      userAgent: "Mozilla/5.0 (Android 15; Mobile; rv:130.0) Gecko/130.0 Firefox/130.0",
      platform: "Linux armv81",
    });
    expect(canDial()).toBe(true);
  });

  it("says yes on iPhone", () => {
    setNavigator({
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      platform: "iPhone",
    });
    expect(canDial()).toBe(true);
  });

  it("says yes on iPadOS pretending to be a Mac", () => {
    setNavigator({
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      platform: "MacIntel",
      maxTouchPoints: 5,
    });
    expect(canDial()).toBe(true);
  });

  it("says no on a desktop, touchscreen or not", () => {
    // A touchscreen Windows laptop matches (pointer: coarse) but still
    // cannot place a call; the UA is the gate for exactly this reason.
    setNavigator({
      userAgent: DESKTOP_UA,
      platform: "Win32",
      maxTouchPoints: 10,
    });
    expect(canDial()).toBe(false);
  });
});
