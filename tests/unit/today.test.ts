import { describe, expect, it } from "vitest";
import { greetingFor, localToday } from "@/lib/today";

/**
 * The bug this guards against actually shipped once.
 *
 * toISOString() converts to UTC first, so from late afternoon in Arizona
 * onward it returns tomorrow's date. next_action_due is a plain calendar
 * date somebody picked in their own timezone, so the two disagreed every
 * evening: steps due today turned red, steps due tomorrow claimed to be due
 * now. The one part of the product that has to be trusted was wrong for
 * seven hours a day.
 */
describe("localToday", () => {
  it("gives the local calendar date, not the UTC one", () => {
    // 25 Aug 2026, 6pm Phoenix (UTC-7) is already 26 Aug in UTC.
    const evening = new Date("2026-08-26T01:30:00Z");
    expect(evening.toISOString().slice(0, 10)).toBe("2026-08-26");
    expect(localToday(evening)).toBe(
      `${evening.getFullYear()}-${String(evening.getMonth() + 1).padStart(2, "0")}-${String(evening.getDate()).padStart(2, "0")}`
    );
  });

  it("pads single-digit months and days", () => {
    expect(localToday(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(localToday(new Date(2026, 8, 9))).toBe("2026-09-09");
  });

  it("is always ten characters, so string comparison sorts correctly", () => {
    for (const d of [new Date(2026, 0, 1), new Date(2026, 11, 31)]) {
      expect(localToday(d)).toHaveLength(10);
    }
    // The comparison nextActionStatus actually relies on.
    expect(localToday(new Date(2026, 0, 9)) < localToday(new Date(2026, 0, 10))).toBe(true);
    expect(localToday(new Date(2026, 8, 1)) > localToday(new Date(2026, 7, 31))).toBe(true);
  });
});

describe("greetingFor", () => {
  it.each([
    [0, "Good morning"],
    [11, "Good morning"],
    [12, "Good afternoon"],
    [17, "Good afternoon"],
    [18, "Good evening"],
    [23, "Good evening"],
  ])("at %i:00 says %s", (hour, expected) => {
    const d = new Date(2026, 7, 25, hour, 0, 0);
    expect(greetingFor(d)).toBe(expected);
  });
});
