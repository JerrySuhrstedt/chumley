import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { leads, organizations, stages, type Stage } from "@/db/schema";

/**
 * A team's board columns.
 *
 * Rows are seeded the first time a team's board is read rather than by a
 * bulk backfill, so no existing team had to be touched to ship this and a
 * team that never opens the board never gets rows. The unique key on
 * (org, key) is what makes that safe against two simultaneous reads.
 */

export { MAX_OPEN_STAGES } from "@/app/(app)/_leads/stage-limits";

/** The board a team starts with, and the meaning behind each column. */
const SEED: { key: string; label: string; kind: Stage["kind"]; color: string }[] =
  [
    { key: "new_lead", label: "New Lead", kind: "open", color: "#2a78d6" },
    { key: "contacted", label: "Contacted", kind: "open", color: "#eb6834" },
    { key: "proposal_sent", label: "Proposal Sent", kind: "open", color: "#4a3aa7" },
    { key: "won", label: "Won", kind: "won", color: "#1baf7a" },
    { key: "lost", label: "Lost", kind: "lost", color: "#d94436" },
    // Never a column. Contacts has its own screen.
    { key: "contact", label: "Contact", kind: "contact", color: "#64748b" },
  ];

/**
 * Won and lost always sit at the right-hand end, whatever their position
 * says, because they are outcomes rather than steps and the dashboard
 * reads them as the end of the funnel.
 */
const RANK: Record<Stage["kind"], number> = {
  open: 0,
  won: 1,
  lost: 2,
  contact: 3,
};

function order(rows: Stage[]): Stage[] {
  return [...rows].sort(
    (a, b) => RANK[a.kind] - RANK[b.kind] || a.position - b.position
  );
}

async function seed(orgId: string): Promise<Stage[]> {
  // Carry across any names the team had already set under the old scheme,
  // so turning this on does not silently rename their board back.
  const [org] = await db
    .select({ labels: organizations.stageLabels })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  await db
    .insert(stages)
    .values(
      SEED.map((s, i) => ({
        orgId,
        key: s.key,
        label: org?.labels?.[s.key]?.trim() || s.label,
        kind: s.kind,
        position: i,
        color: s.color,
      }))
    )
    // A second reader that raced us has already done this.
    .onConflictDoNothing();

  return db.select().from(stages).where(eq(stages.orgId, orgId));
}

/** Every stage a team has, including the off-board contact bucket. */
export async function getStages(orgId: string): Promise<Stage[]> {
  const rows = await db.select().from(stages).where(eq(stages.orgId, orgId));
  return order(rows.length > 0 ? rows : await seed(orgId));
}

/** Just the board columns, left to right. */
export async function getBoardStages(orgId: string): Promise<Stage[]> {
  return (await getStages(orgId)).filter((s) => s.kind !== "contact");
}


/**
 * Where a new lead goes, for this team, right now.
 *
 * Never a hardcoded "new_lead". That key belongs to a bucket the team is
 * free to rename or delete, and a lead written against a bucket that no
 * longer exists is drawn by no column: it is not lost, but nobody can see
 * it, which in a sales pipeline amounts to the same thing.
 */
export async function defaultStageKey(orgId: string): Promise<string> {
  const all = await getStages(orgId);
  return fallbackStage(all).key;
}

/**
 * Accept a bucket key only if this team actually has it.
 *
 * Everything that can name a stage from outside the board goes through
 * here: the CSV importer, the inbound webhook, the website form. None of
 * them know what a given team's board looks like, and the column is plain
 * text with no foreign key behind it, so nothing else would stop them
 * writing a bucket that does not exist.
 */
export async function resolveStageKey(
  orgId: string,
  wanted: string | null | undefined
): Promise<string> {
  const all = await getStages(orgId);
  if (wanted && all.some((s) => s.key === wanted)) return wanted;
  return fallbackStage(all).key;
}

/** Where a lead goes when its bucket is deleted, or its key is unknown. */
export function fallbackStage(all: Stage[]): Stage {
  return all.find((s) => s.kind === "open") ?? all[0];
}

/**
 * Move every lead out of a bucket before it disappears.
 *
 * Done as one statement rather than row by row, because a half-emptied
 * bucket that then fails to delete leaves leads pointing at a column the
 * board will not draw.
 */
export async function emptyStageInto(
  orgId: string,
  fromKey: string,
  toKey: string
) {
  await db
    .update(leads)
    .set({ stage: toKey, updatedAt: new Date() })
    .where(and(eq(leads.orgId, orgId), eq(leads.stage, fromKey)));
}

/** How many leads sit in each bucket, for the delete confirmation. */
export async function stageCounts(orgId: string): Promise<Record<string, number>> {
  const rows = await db
    .select({ stage: leads.stage, n: sql<number>`count(*)::int` })
    .from(leads)
    .where(eq(leads.orgId, orgId))
    .groupBy(leads.stage);

  return Object.fromEntries(rows.map((r) => [r.stage, Number(r.n)]));
}

/** Next free slot on the right-hand end of the open columns. */
export async function nextOpenPosition(orgId: string): Promise<number> {
  const rows = await db
    .select({ position: stages.position })
    .from(stages)
    .where(and(eq(stages.orgId, orgId), eq(stages.kind, "open")))
    .orderBy(asc(stages.position));
  return (rows.at(-1)?.position ?? -1) + 1;
}
