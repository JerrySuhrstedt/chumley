import { describe, expect, it } from "vitest";
import { centsToDollars, dollarsToCents } from "@/lib/paddle/custom-price";
import { SOLO, TEAM_MIN, TEAM_TIERS, tierFor, tierLabel } from "@/app/(marketing)/pricing/plans";

/**
 * Money in a float is a bug waiting for a decimal, and this is the input an
 * administrator types by hand before a real card gets charged against it.
 */
describe("dollarsToCents", () => {
  it("accepts the shapes people actually type", () => {
    expect(dollarsToCents("2")).toBe(200);
    expect(dollarsToCents("2.5")).toBe(250);
    expect(dollarsToCents("2.50")).toBe(250);
    expect(dollarsToCents("$2.50")).toBe(250);
    expect(dollarsToCents("  19 ")).toBe(1900);
  });

  it("refuses anything that is not money", () => {
    expect(dollarsToCents("")).toBeNull();
    expect(dollarsToCents("abc")).toBeNull();
    expect(dollarsToCents("-5")).toBeNull();
    expect(dollarsToCents("2.555")).toBeNull();
    expect(dollarsToCents("1e3")).toBeNull();
  });

  it("refuses zero, because free is a comp and not a price", () => {
    expect(dollarsToCents("0")).toBeNull();
    expect(dollarsToCents("0.00")).toBeNull();
  });

  it("survives a round trip", () => {
    for (const input of ["1", "2.50", "13", "110.99"]) {
      const cents = dollarsToCents(input)!;
      expect(dollarsToCents(centsToDollars(cents))).toBe(cents);
    }
  });
});

describe("the volume ladder", () => {
  it("puts each seat count on the tier the pricing page shows", () => {
    expect(tierFor(3).monthly).toBe(15);
    expect(tierFor(4).monthly).toBe(15);
    expect(tierFor(5).monthly).toBe(13);
    expect(tierFor(9).monthly).toBe(13);
    expect(tierFor(10).monthly).toBe(11);
    expect(tierFor(250).monthly).toBe(11);
  });

  it("never returns a cheaper tier than a larger team would get", () => {
    let previous = Infinity;
    for (let seats = TEAM_MIN; seats <= 40; seats++) {
      const rate = tierFor(seats).monthly;
      expect(rate).toBeLessThanOrEqual(previous);
      previous = rate;
    }
  });

  it("prices a team below any solo rate, which is the whole promise", () => {
    for (const t of TEAM_TIERS) expect(t.monthly).toBeLessThan(SOLO.monthly);
  });

  it("bills yearly at ten months for twelve", () => {
    expect(SOLO.yearly).toBe(SOLO.monthly * 10);
    for (const t of TEAM_TIERS) expect(t.yearly).toBe(t.monthly * 10);
  });

  it("labels the open-ended tier without an upper bound", () => {
    expect(tierLabel(TEAM_TIERS[0])).toBe("3 to 4");
    expect(tierLabel(TEAM_TIERS[TEAM_TIERS.length - 1])).toBe("10 or more");
  });
});
