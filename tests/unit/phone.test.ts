import { describe, expect, it } from "vitest";
import {
  sanitizePhoneInput,
  formatPhoneInput,
  isDialable,
  normalizePhone,
  telDigits,
} from "@/lib/phone";

describe("formatPhoneInput", () => {
  it("formats progressively as somebody types", () => {
    expect(formatPhoneInput("")).toBe("");
    expect(formatPhoneInput("602")).toBe("(602");
    expect(formatPhoneInput("602555")).toBe("(602) 555");
    expect(formatPhoneInput("6025551234")).toBe("(602) 555-1234");
  });

  it("shows a leading US country code rather than hiding it", () => {
    // It used to be stripped on the eleventh keystroke, so the 1 the person
    // typed simply vanished. It now sits outside the parentheses, which is
    // where it belongs and where it cannot be mistaken for an area code.
    expect(formatPhoneInput("16025551234")).toBe("1 (602) 555-1234");
  });

  it("never eats a leading 1 while somebody is still typing", () => {
    // The old mask stripped the 1 at two digits, so typing 1 then 8
    // rendered "(8" and 1-800 numbers could not be typed at all.
    expect(formatPhoneInput("1")).toBe("1");
    expect(formatPhoneInput("18")).toBe("1 (8");
    expect(formatPhoneInput("1800")).toBe("1 (800");
    // The old scrambled middle state. Ten digits starting with 1 used to
    // render as "(180) 055-5123" before snapping shape on the next key.
    expect(formatPhoneInput("1800555123")).toBe("1 (800) 555-123");
    expect(formatPhoneInput("18005551234")).toBe("1 (800) 555-1234");
  });

  it("keeps an extension while typing and when complete", () => {
    expect(formatPhoneInput("(602) 555-1234 x")).toBe("(602) 555-1234 x");
    expect(formatPhoneInput("(602) 555-1234 x22")).toBe(
      "(602) 555-1234 x22"
    );
    expect(formatPhoneInput("602-555-1234 ext 22")).toBe(
      "(602) 555-1234 x22"
    );
  });

  it("leaves a non-plus foreign number alone instead of mangling it", () => {
    expect(formatPhoneInput("0044 20 7946 0958")).toBe("0044 20 7946 0958");
  });

  it("leaves genuinely foreign numbers alone", () => {
    expect(formatPhoneInput("+44 20 7946 0958")).toBe("+44 20 7946 0958");
    expect(formatPhoneInput("+52 55 1234 5678")).toBe("+52 55 1234 5678");
  });

  it("treats +1 as domestic, not foreign", () => {
    expect(formatPhoneInput("+1 602 555 1234")).toBe("1 (602) 555-1234");
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
    expect(normalizePhone(" 1-602-555-1234 ")).toBe("1 (602) 555-1234");
  });

  it("keeps the extension on a stored number", () => {
    expect(normalizePhone("602-555-1234 x22")).toBe("(602) 555-1234 x22");
    expect(normalizePhone("6025551234 ext. 907")).toBe(
      "(602) 555-1234 x907"
    );
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

  it("dials the base number, never the extension", () => {
    // 12 digits down a tel: link is a misdial, not a feature.
    expect(telDigits("(602) 555-1234 x22")).toBe("6025551234");
    expect(telDigits("ext 4412")).toBeNull();
  });
});

describe("isDialable", () => {
  it("lights up only for a number a dialer can actually place", () => {
    expect(isDialable("(602) 555-1234")).toBe(true);
    expect(isDialable("16025551234")).toBe(true);
    expect(isDialable("(602) 555-1234 x22")).toBe(true);
    expect(isDialable("+44 20 7946 0958")).toBe(true);
  });

  it("stays dark for anything else", () => {
    expect(isDialable(null)).toBe(false);
    expect(isDialable("")).toBe(false);
    expect(isDialable("   ")).toBe(false);
    expect(isDialable("n/a")).toBe(false);
    expect(isDialable("602555")).toBe(false);
    expect(isDialable("ext 4412")).toBe(false);
  });
});

/**
 * From Joudi Mohammad's UAT round 2, check MD-2, on a Galaxy S25.
 * Each of these was typed by hand and reported with a screenshot.
 */
describe("MD-2: the edge cases from UAT", () => {
  it("keeps the leading 1 on an 11-digit toll-free number", () => {
    // The reported defect: "typing beyond 9 digits causes the input mask to
    // drop the leading 1 to make room for the 10th digit".
    expect(formatPhoneInput("18005551234")).toBe("1 (800) 555-1234");
    expect(normalizePhone("1-800-555-1234")).toBe("1 (800) 555-1234");
  });

  it("never scrambles the number on the way there", () => {
    // Every intermediate state has to be readable, because somebody is
    // looking at it while they type.
    const typed = "18005551234";
    for (let i = 1; i <= typed.length; i++) {
      const out = formatPhoneInput(typed.slice(0, i));
      expect(out.startsWith("1")).toBe(true);
    }
  });

  it("strips the junk out of a malformed paste", () => {
    // Reported as saved verbatim: "+++971 __44".
    expect(sanitizePhoneInput("+++971 __44")).toBe("+971 44");
    expect(sanitizePhoneInput("602))..555--1234")).toBe("602))..555--1234");
    expect(sanitizePhoneInput("6o2-555-l234!!")).toBe("62-555-234");
  });

  it("caps the length instead of accepting digits forever", () => {
    // Reported as "manual input permits typing digits infinitely".
    const long = "1".repeat(40);
    expect(sanitizePhoneInput(long).replace(/\D/g, "").length).toBe(15);
  });

  it("still keeps what the tester confirmed was already fixed", () => {
    // These passed in round 2 and must not regress.
    expect(formatPhoneInput("602-555-1234 x22")).toBe("(602) 555-1234 x22");
    expect(formatPhoneInput("+44 20 7946 0958")).toBe("+44 20 7946 0958");
    expect(formatPhoneInput("  6025551234  ")).toBe("(602) 555-1234");
  });
});
