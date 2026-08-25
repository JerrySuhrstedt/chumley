import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEACTIVATED_MESSAGE,
  READ_ONLY_MESSAGE,
  TRIAL_ENDED_MESSAGE,
} from "@/lib/gate-messages";

const sent: { key: string; subject: string }[] = [];

vi.mock("@/lib/alert", () => ({
  alertAsync: (key: string, subject: string) => sent.push({ key, subject }),
  alert: async () => {},
}));

const { reportError } = await import("@/lib/report-error");

/**
 * The filter is the whole difference between error reporting that gets
 * read and error reporting that gets a mail rule. The gate throws to refuse
 * a write and Next throws to redirect; both travel as exceptions and
 * neither is a bug.
 */
describe("reportError", () => {
  beforeEach(() => {
    sent.length = 0;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("reports a genuine fault", () => {
    reportError(new Error("Cannot read properties of undefined"), "/pipeline");
    expect(sent).toHaveLength(1);
    expect(sent[0].subject).toContain("Cannot read properties");
  });

  it.each([
    ["read-only refusal", READ_ONLY_MESSAGE],
    ["trial ended refusal", TRIAL_ENDED_MESSAGE],
    ["deactivated refusal", DEACTIVATED_MESSAGE],
  ])("stays quiet on a %s", (_label, message) => {
    reportError(new Error(message), "/pipeline");
    expect(sent).toHaveLength(0);
  });

  it("stays quiet on Next's own control flow", () => {
    reportError(new Error("NEXT_REDIRECT;replace;/login;307"), "/pipeline");
    reportError(new Error("NEXT_NOT_FOUND"), "/pipeline");
    const tagged = Object.assign(new Error("boom"), { digest: "NEXT_REDIRECT" });
    reportError(tagged, "/pipeline");
    expect(sent).toHaveLength(0);
  });

  it("gives the same fault the same key, so repeats collapse", () => {
    reportError(new Error("Database timeout"), "/pipeline");
    reportError(new Error("Database timeout"), "/pipeline");
    expect(sent[0].key).toBe(sent[1].key);
  });

  it("separates the same message from different places", () => {
    reportError(new Error("Database timeout"), "/pipeline");
    reportError(new Error("Database timeout"), "/contacts");
    expect(sent[0].key).not.toBe(sent[1].key);
  });

  it("ignores ids and numbers, so one bug is not many alerts", () => {
    // The same fault about two different leads is one bug, not two.
    reportError(
      new Error("Lead 3f2b9c1e-1111-4a2b-9c3d-aaaaaaaaaaaa not found"),
      "/pipeline"
    );
    reportError(
      new Error("Lead 7a1c4d5f-2222-4b3c-8d4e-bbbbbbbbbbbb not found"),
      "/pipeline"
    );
    expect(sent[0].key).toBe(sent[1].key);
  });

  it("survives being handed something that is not an Error", () => {
    expect(() => reportError("just a string", "/x")).not.toThrow();
    expect(() => reportError(null, "/x")).not.toThrow();
    expect(sent.length).toBeGreaterThan(0);
  });
});
