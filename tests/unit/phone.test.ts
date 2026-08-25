import { describe, expect, it } from "vitest";
import { formatPhoneInput, normalizePhone, telDigits } from "@/lib/phone";

describe("formatPhoneInput", () => {
  it("formats progressively as somebody types", () => {
    expect(formatPhoneInput("")).toBe("");
    expect(formatPhoneInput("602")).toBe("(602");
    expect(formatPhoneInput("602555")).toBe("(602) 555");
    expect(formatPhoneInput("6025551234")).toBe("(602) 555-1234");
  });

  it("drops a leading US country code", () => {
    expect(formatPhoneInput("16025551234")).toBe("(602) 555-1234");
  });

  it("leaves genuinely foreign numbers alone", () => {
    expect(formatPhoneInput("+44 20 7946 0958")).toBe("+44 20 7946 0958");
    expect(formatPhoneInput("+52 55 1234 5678")).toBe("+52 55 1234 5678");
  });

  it("treats +1 as domestic, not foreign", () => {
    expect(formatPhoneInput("+1 602 555 1234")).toBe("(602) 555-1234");
  });

  it("ignores punctuation people paste in", () => {
    expect(formatPhoneInput("602.555.1234")).toBe("(602) 555-1234");
    expect(formatPhoneInput("(602) 555-1234")).toBe("(602) 555-1234");
  });
});

describe("normalizePhone", () => {
  it("returns null for nothing", () => {
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone(undefined)).toBeNull();
    expect(normalizePhone("   ")).toBeNull();
  });

  it("keeps an incomplete number exactly as entered", () => {
    // Half a number is still worth storing. Mangling it into a shape it
    // does not have would lose what the rep actually wrote down.
    expect(normalizePhone("602555")).toBe("602555");
    expect(normalizePhone("ext 4412")).toBe("ext 4412");
  });

  it("normalizes a complete number", () => {
    expect(normalizePhone("6025551234")).toBe("(602) 555-1234");
    expect(normalizePhone(" 1-602-555-1234 ")).toBe("(602) 555-1234");
  });
});

describe("telDigits", () => {
  it("strips everything a dialer would choke on", () => {
    expect(telDigits("(602) 555-1234")).toBe("6025551234");
  });

  it("keeps the plus on an international number", () => {
    expect(telDigits("+44 20 7946 0958")).toBe("+442079460958");
  });

  it("returns null when there is nothing to dial", () => {
    expect(telDigits(null)).toBeNull();
    expect(telDigits("")).toBeNull();
    expect(telDigits("no number")).toBeNull();
  });
});
