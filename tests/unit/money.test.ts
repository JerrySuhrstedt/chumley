import { describe, expect, it } from "vitest";
import { centsToDollars, dollarsToCents } from "@/lib/paddle/custom-price";
import { PRICE } from "@/app/(marketing)/pricing/plans";
import { PRICES, priceFor } from "@/lib/paddle/catalog";

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

describe("flat pricing", () => {
  it("is one price, which is the entire model", () => {
    expect(PRICE).toBe(14);
  });

  it("charges every seat count the same single Paddle price", () => {
    // priceFor takes no arguments any more: there is exactly one answer,
    // and this test exists so a future second answer has to come here
    // and explain itself.
    expect(priceFor()).toBe(PRICES.flat.monthly);
  });
});
