import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { and, eq, inArray, notInArray } from "drizzle-orm";
import { db } from "@/db";
import { backlogItems, type BacklogScope } from "@/db/schema";
import { ALL_CHECKS } from "@/app/uat/checks";
import { CODEBASE_MAP } from "./codebase-map";

/**
 * Turns raw tester findings into reviewable backlog items by asking
 * Claude to scope each one against the codebase map: what is probably
 * wrong, where, what the fix is, how big, what it could break.
 *
 * Runs after the tester's response has already been sent (see the after()
 * call in the submit action), so nothing here is allowed to matter to the
 * tester: every failure path ends in scope_status = "failed" and a
 * "Scope now" button in the back office, never a lost finding. The rows
 * exist before this function is ever called.
 */

const scopeSchema = z.object({
  items: z.array(
    z.object({
      /** Echoed back so results survive reordering. */
      backlogItemId: z.string(),
      summary: z.string(),
      likelyCause: z.string(),
      files: z.array(z.string()),
      proposedFix: z.string(),
      size: z.enum(["Super simple", "Easy", "Medium", "Complex"]),
      risk: z.string().nullable(),
      duplicateOfId: z.string().nullable(),
    })
  ),
});

const SYSTEM = `You scope bug fixes for Chumley. Each finding below came from a
non-technical human tester working through a scripted punch list; each check
has a "should" describing correct behavior, and the tester's note describes
what they saw instead.

For every finding, produce a fix scope an owner can approve or reject without
opening the code:
- summary: one plain sentence naming the defect. Not the tester's words back;
  the defect.
- likelyCause: your best engineering hypothesis of what is wrong and where.
  Reason from the codebase map; name real files from it.
- files: the repo-relative paths a developer should open first, from the map
  only. Never invent a path.
- proposedFix: what to change, concretely. If the honest answer is "needs a
  reproduction first", say that and what to instrument.
- size: the owner's four-tier scale. "Super simple" is minutes in one file
  with no way to break anything else. "Easy" is an hour or two across a
  couple of files, low risk. "Medium" is half a day to a day, several files
  or shared state, needs real testing. "Complex" is multiple days, or it
  touches auth, data writes, or gesture logic where a bad fix is worse
  than the bug.
- risk: what this fix could plausibly break, plainly. null only when there is
  genuinely nothing worth naming.
- duplicateOfId: if the finding describes the same underlying defect as one of
  the existing open backlog items provided, that item's id, else null. Same
  symptom from a different tester is a duplicate; same screen but a different
  defect is not.

A finding can be tester error or working-as-intended; say so in the summary
and propose the smallest thing that would prevent the confusion, or "no
change" as the proposedFix. Be specific over comprehensive. No hedging
boilerplate.

${CODEBASE_MAP}`;

type Finding = {
  id: string;
  checkId: string;
  note: string;
  severity: string | null;
};

function findingBlock(f: Finding): string {
  const check = ALL_CHECKS.find((c) => c.id === f.checkId);
  return [
    `backlogItemId: ${f.id}`,
    `check: ${f.checkId} — ${check?.what ?? "unknown"}`,
    check ? `instructions given to the tester: ${check.how}` : null,
    check ? `expected ("should"): ${check.should}` : null,
    f.severity ? `tester's severity: ${f.severity}` : null,
    `tester's note: ${f.note}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Scope the given backlog items in one API call, writing results back to
 * their rows. Safe to call again for the same ids: only rows still
 * pending or failed are sent, and a second scope simply overwrites.
 */
export async function scopeBacklogItems(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  const rows = await db
    .select({
      id: backlogItems.id,
      checkId: backlogItems.checkId,
      note: backlogItems.note,
      severity: backlogItems.severity,
    })
    .from(backlogItems)
    .where(
      and(
        inArray(backlogItems.id, ids),
        inArray(backlogItems.scopeStatus, ["pending", "failed"])
      )
    );
  if (rows.length === 0) return;

  const fail = () =>
    db
      .update(backlogItems)
      .set({ scopeStatus: "failed", updatedAt: new Date() })
      .where(
        inArray(
          backlogItems.id,
          rows.map((r) => r.id)
        )
      );

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("scopeBacklogItems: ANTHROPIC_API_KEY is not set");
    await fail();
    return;
  }

  // Open items the new findings could duplicate. Rejected and done items
  // are deliberately included in "not these": a rejected fix reported
  // again by a second tester is worth seeing fresh, not auto-filed.
  const existing = await db
    .select({ id: backlogItems.id, scope: backlogItems.scope })
    .from(backlogItems)
    .where(
      and(
        inArray(backlogItems.status, ["new", "approved"]),
        eq(backlogItems.scopeStatus, "scoped"),
        notInArray(
          backlogItems.id,
          rows.map((r) => r.id)
        )
      )
    );

  const openList =
    existing.length === 0
      ? "none"
      : existing
          .map((e) => `${e.id}: ${e.scope?.summary ?? "(no summary)"}`)
          .join("\n");

  try {
    const client = new Anthropic();
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 16000,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Existing open backlog items (for duplicateOfId, use these ids only):
${openList}

New findings to scope, one scope per backlogItemId:

${rows.map(findingBlock).join("\n\n---\n\n")}`,
        },
      ],
      output_config: { format: zodOutputFormat(scopeSchema) },
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      await fail();
      return;
    }

    const validIds = new Set(existing.map((e) => e.id));
    const byId = new Map(
      response.parsed_output.items.map((i) => [i.backlogItemId, i])
    );
    for (const row of rows) {
      const item = byId.get(row.id);
      if (!item) {
        await db
          .update(backlogItems)
          .set({ scopeStatus: "failed", updatedAt: new Date() })
          .where(eq(backlogItems.id, row.id));
        continue;
      }
      const scope: BacklogScope = {
        summary: item.summary,
        likelyCause: item.likelyCause,
        files: item.files,
        proposedFix: item.proposedFix,
        size: item.size,
        risk: item.risk,
        // A hallucinated id would render as a dead cross-reference.
        duplicateOfId:
          item.duplicateOfId && validIds.has(item.duplicateOfId)
            ? item.duplicateOfId
            : null,
      };
      await db
        .update(backlogItems)
        .set({ scope, scopeStatus: "scoped", updatedAt: new Date() })
        .where(eq(backlogItems.id, row.id));
    }
  } catch (e) {
    console.error("scopeBacklogItems failed:", e);
    await fail();
  }
}
