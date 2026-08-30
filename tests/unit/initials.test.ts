import { describe, expect, it } from "vitest";
import { initials } from "@/lib/utils";

describe("initials", () => {
  it("skips tokens that do not start with a letter or digit", () => {
    // The old helper took the first two whitespace tokens blind, so
    // "Hall & Sons" rendered as H& on every avatar in the app.
    expect(initials("Hall & Sons")).toBe("HS");
    expect(initials("Smith - Jones")).toBe("SJ");
  });

  it("handles ordinary names", () => {
    expect(initials("Joudi Mohammad")).toBe("JM");
    expect(initials("Cher")).toBe("C");
  });

  it("is unicode-aware", () => {
    expect(initials("Núñez García")).toBe("NG");
    expect(initials("O'Brien")).toBe("O");
  });

  it("never returns an empty bubble for a non-empty name", () => {
    expect(initials("&")).toBe("&");
    expect(initials("")).toBe("");
    expect(initials("   ")).toBe("");
  });

  it("respects the max", () => {
    expect(initials("Ace Building And Sons", 3)).toBe("ABA");
  });
});
