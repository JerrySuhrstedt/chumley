"use server";

import { after } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { backlogItems, uatReports, uatTesters } from "@/db/schema";
import { scopeBacklogItems } from "@/lib/backlog/scope";
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

  // A personal link, if the run came through one. An unknown token is
  // treated as no token: the report is still worth having.
  const token = String(formData.get("testerToken") ?? "")
    .trim()
    .slice(0, 64);
  let testerId: string | null = null;
  if (token) {
    const tester = await db
      .select({ id: uatTesters.id })
      .from(uatTesters)
      .where(eq(uatTesters.token, token))
      .limit(1);
    testerId = tester[0]?.id ?? null;
  }

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

  const [report] = await db
    .insert(uatReports)
    .values({
      testerId,
      testerName: name,
      testerEmail: email,
      findings,
      triedCount,
      totalCount: ALL_CHECKS.length,
    })
    .returning({ id: uatReports.id });

  // Every finding with a note becomes a backlog item right now, so the
  // backlog can never lose a finding to a scoping failure. Claude fills
  // in the fix scope after the tester already has their confirmation.
  const issues = findings.filter((f) => f.note);
  if (issues.length > 0) {
    const rows = await db
      .insert(backlogItems)
      .values(
        issues.map((f) => ({
          reportId: report.id,
          checkId: f.id,
          testerName: name,
          note: f.note!,
          severity: f.severity,
        }))
      )
      .returning({ id: backlogItems.id });

    after(() => scopeBacklogItems(rows.map((r) => r.id)));
  }

  return { error: null, sent: true };
}

/**
 * Autosave for personal tester links, so a run started on one laptop
 * resumes on the phone. Same trust stance as the submit: the token is the
 * only identity, the shape is rebuilt against the known check list, and
 * free text is capped. Failures are silent by design; the browser copy
 * in localStorage is the fallback, and a tester should never see an
 * error for an autosave.
 */
export async function saveUatDraft(
  token: string,
  itemsJson: string
): Promise<void> {
  const cleanToken = String(token ?? "").trim().slice(0, 64);
  if (!cleanToken || itemsJson.length > 200_000) return;

  let raw: unknown;
  try {
    raw = JSON.parse(itemsJson);
  } catch {
    return;
  }
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return;

  const items: Record<
    string,
    { tried: boolean; flagged: boolean; note: string; severity: string | null }
  > = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!CHECK_IDS.has(id)) continue;
    if (value === null || typeof value !== "object") continue;
    const v = value as Record<string, unknown>;
    items[id] = {
      tried: v.tried === true,
      flagged: v.flagged === true,
      note:
        typeof v.note === "string" ? v.note.slice(0, 2000) : "",
      severity:
        typeof v.severity === "string" &&
        (SEVERITIES as readonly string[]).includes(v.severity)
          ? v.severity
          : null,
    };
  }

  await db
    .update(uatTesters)
    .set({ draft: items, draftUpdatedAt: new Date() })
    .where(eq(uatTesters.token, cleanToken));
}
