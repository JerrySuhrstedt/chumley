"use server";

import { db } from "@/db";
import { uatReports } from "@/db/schema";
import { ALL_CHECKS, CHECK_IDS, SEVERITIES } from "./checks";

export type UatSubmitState = { error: string | null; sent: boolean };

/**
 * Public on purpose: the tester has no account and never will. Everything
 * arriving here is untrusted, so the shape is rebuilt from scratch against
 * the known check list rather than stored as sent, and every free-text
 * field is length-capped. The worst an abuser can do is file a boring
 * report.
 */
export async function submitUatReport(
  _prev: UatSubmitState,
  formData: FormData
): Promise<UatSubmitState> {
  const name = String(formData.get("testerName") ?? "").trim().slice(0, 120);
  const email = String(formData.get("testerEmail") ?? "").trim().slice(0, 200);
  if (!name) return { error: "Your name is missing.", sent: false };
  if (!email.includes("@"))
    return { error: "That email does not look right.", sent: false };

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("findings") ?? "[]"));
  } catch {
    return { error: "The checklist did not come through. Try again.", sent: false };
  }
  if (!Array.isArray(raw) || raw.length > 200)
    return { error: "The checklist did not come through. Try again.", sent: false };

  const byId = new Map<string, { tried: boolean; note: string | null; severity: string | null }>();
  for (const entry of raw) {
    if (entry === null || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const id = String(e.id ?? "");
    if (!CHECK_IDS.has(id)) continue;
    const note = typeof e.note === "string" ? e.note.trim().slice(0, 2000) : "";
    const severity =
      typeof e.severity === "string" &&
      (SEVERITIES as readonly string[]).includes(e.severity)
        ? e.severity
        : null;
    byId.set(id, {
      tried: e.tried === true,
      note: note || null,
      severity: note ? severity : null,
    });
  }

  const findings = ALL_CHECKS.map((c) => ({
    id: c.id,
    tried: byId.get(c.id)?.tried ?? false,
    note: byId.get(c.id)?.note ?? null,
    severity: byId.get(c.id)?.severity ?? null,
  }));
  const triedCount = findings.filter((f) => f.tried).length;
  if (triedCount === 0 && findings.every((f) => !f.note))
    return { error: "Nothing is filled in yet.", sent: false };

  await db.insert(uatReports).values({
    testerName: name,
    testerEmail: email,
    findings,
    triedCount,
    totalCount: ALL_CHECKS.length,
  });

  return { error: null, sent: true };
}
