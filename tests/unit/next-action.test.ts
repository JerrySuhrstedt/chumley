import { describe, expect, it } from "vitest";
import { nextActionStatus } from "@/app/(app)/_leads/stages";
import { localToday } from "@/lib/today";

const shift = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return localToday(d);
};

/**
 * The colour on every card. Getting this wrong either cries wolf on steps
 * that are not due, or stays quiet on ones that are, and the second is how
 * a deal goes cold without anybody noticing.
 */
describe("nextActionStatus", () => {
  it("nudges when there is no next step at all", () => {
    const s = nextActionStatus({ nextActionText: null, nextActionDue: null });
    expect(s.key).toBe("none");
    expect(s.label).toBe("No next step");
  });

  it("treats a step with no date as upcoming, never overdue", () => {
    const s = nextActionStatus({
      nextActionText: "Call back",
      nextActionDue: null,
    });
    expect(s.key).toBe("upcoming");
    expect(s.label).toBe("Call back");
  });

  it("is due today on today's date", () => {
    expect(
      nextActionStatus({ nextActionText: "Call", nextActionDue: shift(0) }).key
    ).toBe("today");
  });

  it("is overdue yesterday and not before", () => {
    expect(
      nextActionStatus({ nextActionText: "Call", nextActionDue: shift(-1) }).key
    ).toBe("overdue");
    expect(
      nextActionStatus({ nextActionText: "Call", nextActionDue: shift(1) }).key
    ).toBe("upcoming");
  });

  it("does not flip on the boundary the UTC bug used to break", () => {
    // Whatever the hour, today must read as today rather than overdue.
    expect(
      nextActionStatus({ nextActionText: "Call", nextActionDue: localToday() })
        .key
    ).toBe("today");
  });

  it("carries the step's own words as the label once one is set", () => {
    const s = nextActionStatus({
      nextActionText: "Send the revised bid",
      nextActionDue: shift(3),
    });
    expect(s.label).toBe("Send the revised bid");
  });
});
