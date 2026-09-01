"use server";

import { after } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { backlogItems, uatReports, uatTesters } from "@/db/schema";
import { scopeBacklogItems } from "@/lib/backlog/scope";
import {
  ALL_CHECKS,
  CHECK_IDS,
  PUNCH_LIST_VERSION,
  SEVERITIES,
} from "./checks";

export type UatSubmitState = { error: string | null; sent: boolean };

/**
 * A global hourly ceiling on public writes to the punch list. The page is
 * public and each submission fans out into rows and a paid scoping call,
 * and each minted token defeats a per-token limit, so the cap is global
 * and counts the table directly. Real testing days sit in single digits.
 */
async function overPunchListCap(
  table: typeof uatReports | typeof uatTesters,
  perHour: number
): Promise<boolean> {
  const [{ n }] = (await db
    .select({ n: sql<number>`count(*)::int` })
    .from(table)
    .where(sql`created_at > now() - interval '1 hour'`)) as { n: number }[];
  return n >= perHour;
}

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

  if (await overPunchListCap(uatReports, 40)) {
    return {
      error: "We are getting a lot of submissions right now. Try again shortly.",
      sent: false,
    };
  }

  // A personal link, if the run came through one. An unknown token is
  // treated as no token: the report is still worth having.
  const token = String(formData.get("testerToken") ?? "")
    .trim()
    .slice(0, 64);
  let testerId: string | null = null;
  // On a retest the run is out of that many checks, not all of them, or
  // the back office reports "14 of 33 tried" for a perfect round.
  let focusCount: number | null = null;
  if (token) {
    const tester = await db
      .select({ id: uatTesters.id, focus: uatTesters.focus })
      .from(uatTesters)
      .where(eq(uatTesters.token, token))
      .limit(1);
    testerId = tester[0]?.id ?? null;
    focusCount = tester[0]?.focus?.length ? tester[0].focus.length : null;
  }

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("findings") ?? "[]"));
  } catch {
    return { error: "The checklist did not come through. Try again.", sent: false };
  }
  if (!Array.isArray(raw) || raw.length > 200)
    return { error: "The checklist did not come through. Try again.", sent: false };

  const UUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const byId = new Map<
    string,
    {
      tried: boolean;
      note: string | null;
      severity: string | null;
      measurement: number | null;
      attachments: string[];
    }
  >();
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
    const measurement =
      typeof e.measurement === "number" && Number.isFinite(e.measurement)
        ? Math.min(Math.max(Math.round(e.measurement), 0), 36_000)
        : null;
    const attachments = Array.isArray(e.attachments)
      ? e.attachments
          .filter((a): a is string => typeof a === "string" && UUID.test(a))
          .slice(0, 5)
      : [];
    byId.set(id, {
      tried: e.tried === true,
      note: note || null,
      severity: note ? severity : null,
      measurement,
      attachments,
    });
  }

  const findings = ALL_CHECKS.map((c) => {
    const f = byId.get(c.id);
    let note = f?.note ?? null;
    // A measured miss files itself: the number over the check's limit IS
    // the finding, and a tester who timed 190 seconds against a 120-second
    // promise should not also have to write an essay about it.
    const m = c.measurement;
    const value = f?.measurement ?? null;
    if (m?.limit != null && value != null && value > m.limit) {
      const measured = `Measured: ${value} seconds. The promise is ${m.limit} seconds or under.`;
      note = note ? `${measured}\n${note}` : measured;
    }
    return {
      id: c.id,
      tried: f?.tried ?? false,
      note,
      severity: f?.severity ?? null,
      measurement: value,
      attachments: f?.attachments ?? [],
    };
  });
  const triedCount = findings.filter((f) => f.tried).length;
  if (
    triedCount === 0 &&
    findings.every((f) => !f.note && f.measurement == null)
  )
    return { error: "Nothing is filled in yet.", sent: false };

  const [report] = await db
    .insert(uatReports)
    .values({
      testerId,
      testerName: name,
      testerEmail: email,
      listVersion: PUNCH_LIST_VERSION,
      findings,
      triedCount,
      totalCount: focusCount ?? ALL_CHECKS.length,
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
          attachments: f.attachments.length > 0 ? f.attachments : null,
        }))
      )
      .returning({ id: backlogItems.id });

    after(() => scopeBacklogItems(rows.map((r) => r.id)));
  }

  return { error: null, sent: true };
}

/**
 * A walk-in becoming a named tester. Somebody who lands on plain /uat
 * and fills in who they are gets a personal link minted on the spot,
 * exactly as if the owner had handed them a blank one: same table, same
 * cross-device draft, same identity rules. The client then moves them
 * onto /uat/{token}. On any failure the caller falls back to the old
 * anonymous run, so this can only ever add, never block.
 */
export async function startUatRun(
  name: string,
  email: string
): Promise<{ token: string } | { error: string }> {
  const cleanName = String(name ?? "").trim().slice(0, 120);
  const cleanEmail = String(email ?? "").trim().slice(0, 200);
  if (!cleanName || !cleanEmail.includes("@"))
    return { error: "Name and email are needed first." };

  // Minting a fresh token per request is how an abuser sidesteps a
  // per-token limit, so token creation is capped too.
  if (await overPunchListCap(uatTesters, 40)) {
    return { error: "Try again in a little while." };
  }

  const { randomBytes } = await import("crypto");
  const token = randomBytes(8).toString("base64url");
  await db.insert(uatTesters).values({
    token,
    name: cleanName,
    email: cleanEmail,
  });
  return { token };
}

/**
 * A blank link introducing itself. Links can be created with no name or
 * email for handing out in communities where the owner has neither; the
 * first person to open one fills in who they are, and the link is theirs
 * from then on. Only an unclaimed link accepts a claim, so a forwarded
 * link cannot be renamed out from under its tester.
 */
export async function claimUatTester(
  token: string,
  name: string,
  email: string
): Promise<void> {
  const cleanToken = String(token ?? "").trim().slice(0, 64);
  const cleanName = String(name ?? "").trim().slice(0, 120);
  const cleanEmail = String(email ?? "").trim().slice(0, 200);
  if (!cleanToken || !cleanName || !cleanEmail.includes("@")) return;

  await db
    .update(uatTesters)
    .set({ name: cleanName, email: cleanEmail })
    .where(and(eq(uatTesters.token, cleanToken), eq(uatTesters.name, "")));
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

  const cap = (v: unknown, n: number) =>
    typeof v === "string" ? v.slice(0, n) : "";
  const items: Record<
    string,
    {
      tried: boolean;
      flagged: boolean;
      did: string;
      expected: string;
      actual: string;
      browser: string;
      extra: string;
      severity: string | null;
      measurement: string;
      attachments: string[];
    }
  > = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!CHECK_IDS.has(id)) continue;
    if (value === null || typeof value !== "object") continue;
    const v = value as Record<string, unknown>;
    items[id] = {
      tried: v.tried === true,
      flagged: v.flagged === true,
      did: cap(v.did, 2000),
      expected: cap(v.expected, 2000),
      actual: cap(v.actual, 2000),
      browser: cap(v.browser, 200),
      // Drafts saved before the write-up split carried one `note`; it
      // rides along in extra so nothing a tester wrote is dropped.
      extra: cap(v.extra, 2000) || cap(v.note, 2000),
      severity:
        typeof v.severity === "string" &&
        (SEVERITIES as readonly string[]).includes(v.severity)
          ? v.severity
          : null,
      measurement: cap(v.measurement, 20),
      attachments: Array.isArray(v.attachments)
        ? v.attachments
            .filter((a): a is string => typeof a === "string")
            .map((a) => a.slice(0, 36))
            .slice(0, 5)
        : [],
    };
  }

  await db
    .update(uatTesters)
    .set({ draft: items, draftUpdatedAt: new Date() })
    .where(eq(uatTesters.token, cleanToken));
}
