import { describe, expect, it } from "vitest";
import { isUuid } from "@/lib/token";

describe("isUuid", () => {
  it("accepts a real v4 uuid, any case", () => {
    expect(isUuid("9d08c01e-a8f7-4ebb-9bf4-f8f479de33b8")).toBe(true);
    expect(isUuid("9D08C01E-A8F7-4EBB-9BF4-F8F479DE33B8")).toBe(true);
  });

  it("rejects the shapes that would raise a 500 against a uuid column", () => {
    // These are the values that made /f/[token] and the webhook route
    // throw 22P02 instead of answering 404.
    expect(isUuid("nope")).toBe(false);
    expect(isUuid("robots.txt")).toBe(false);
    expect(isUuid("")).toBe(false);
    expect(isUuid("9d08c01e-a8f7-4ebb-9bf4")).toBe(false);
    expect(isUuid("9d08c01e_a8f7_4ebb_9bf4_f8f479de33b8")).toBe(false);
    expect(isUuid("../../etc/passwd")).toBe(false);
  });
});
