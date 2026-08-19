"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { stages } from "@/db/schema";
import { getCurrentOrg } from "@/lib/org";
import {
  MAX_OPEN_STAGES,
  emptyStageInto,
  fallbackStage,
  getStages,
  nextOpenPosition,
  stageCounts,
} from "@/lib/stages";

/**
 * Changing the shape of the board.
 *
 * Won and lost are off limits throughout. They are not really columns,
 * they are the two answers, and the dashboard and funnel both count on
 * exactly one of each existing. Everything else a team can do what it
 * likes with.
 */

/**
 * Re-read the buckets everywhere they are shown.
 *
 * It has to be the layout, not the pages. The stage list is provided from
 * the (app) layout so that the board, contacts, the dashboard and the
 * search box all see the same one, and revalidating a path on its own
 * leaves that layout untouched. The result was a new bucket that did not
 * appear until the browser was refreshed by hand.
 *
 * The root layout is the honest target rather than one route: a renamed
 * bucket shows on the board, in Contacts, in the funnel and in search
 * results, and these changes happen a handful of times in a team's life,
 * so there is nothing to be won by being clever about the scope.
 */
function refresh() {
  revalidatePath("/", "layout");
}

/** A key that cannot collide with a future default or an existing bucket. */
function keyFor(label: string, taken: Set<string>) {
  const base =
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 24) || "stage";
  let key = `c_${base}`;
  let n = 2;
  while (taken.has(key)) key = `c_${base}_${n++}`;
  return key;
}

export async function addStage(label: string) {
  const current = await getCurrentOrg();
  if (!current) return { error: "No organization." };

  const name = label.trim();
  if (!name) return { error: "Give the bucket a name." };
  if (name.length > 24) return { error: "Keep it under 24 characters." };

  const all = await getStages(current.org.id);
  const open = all.filter((s) => s.kind === "open");

  if (open.length >= MAX_OPEN_STAGES) {
    return {
      error: `${MAX_OPEN_STAGES} buckets is the limit. A board you have to scroll is a board nobody reads.`,
    };
  }

  await db.insert(stages).values({
    orgId: current.org.id,
    key: keyFor(name, new Set(all.map((s) => s.key))),
    label: name,
    kind: "open",
    position: await nextOpenPosition(current.org.id),
    color: "#7a5af8",
  });

  refresh();
  return { error: null };
}

export async function renameStage(id: string, label: string) {
  const current = await getCurrentOrg();
  if (!current) return { error: "No organization." };

  const name = label.trim();
  if (!name) return { error: "A bucket needs a name." };
  if (name.length > 24) return { error: "Keep it under 24 characters." };

  await db
    .update(stages)
    .set({ label: name })
    .where(and(eq(stages.id, id), eq(stages.orgId, current.org.id)));

  refresh();
  return { error: null };
}

/**
 * Reorder the working columns.
 *
 * Takes the full list of open stage ids in their new order. Sending the
 * whole order rather than one moved id means the result cannot drift out
 * of step with what the person just dragged.
 */
export async function reorderStages(orderedIds: string[]) {
  const current = await getCurrentOrg();
  if (!current) return { error: "No organization." };

  const all = await getStages(current.org.id);
  const open = new Set(all.filter((s) => s.kind === "open").map((s) => s.id));

  // Ignore anything that is not one of this team's working columns, so a
  // tampered payload cannot drag won or lost into the middle.
  const clean = orderedIds.filter((id) => open.has(id));
  if (clean.length !== open.size) return { error: "That order is not valid." };

  await db.transaction(async (tx) => {
    for (const [i, id] of clean.entries()) {
      await tx
        .update(stages)
        .set({ position: i })
        .where(and(eq(stages.id, id), eq(stages.orgId, current.org.id)));
    }
  });

  refresh();
  return { error: null };
}

/**
 * Remove a bucket, moving whatever is in it somewhere the team chooses.
 *
 * The destination is required rather than guessed. An earlier version
 * moved deals to the bucket on the left, which is a reasonable default
 * and still the wrong thing to do silently: the person deleting "Proposal
 * Sent" usually knows exactly where those deals belong, and finding them
 * somewhere else afterwards is worse than being asked.
 */
export async function deleteStage(id: string, destinationKey: string) {
  const current = await getCurrentOrg();
  if (!current) return { error: "No organization." };

  const all = await getStages(current.org.id);
  const target = all.find((s) => s.id === id);
  if (!target) return { error: "That bucket is already gone." };

  if (target.kind !== "open") {
    return { error: "Won and Lost cannot be removed." };
  }

  const open = all.filter((s) => s.kind === "open");
  if (open.length <= 1) {
    return { error: "Keep at least one working bucket." };
  }

  const destination = all.find((s) => s.key === destinationKey);
  if (!destination || destination.id === target.id) {
    return { error: "Pick somewhere for the deals to go." };
  }

  // Move first, delete second. The other order would leave deals pointing
  // at a bucket the board will not draw if the move then failed.
  await emptyStageInto(current.org.id, target.key, destination.key);
  await db
    .delete(stages)
    .where(and(eq(stages.id, id), eq(stages.orgId, current.org.id)));

  // Close the gap so positions stay 0..n-1.
  const left = (await getStages(current.org.id)).filter(
    (s) => s.kind === "open"
  );
  await db.transaction(async (tx) => {
    for (const [i, s] of left.entries()) {
      await tx.update(stages).set({ position: i }).where(eq(stages.id, s.id));
    }
  });

  refresh();
  return { error: null, movedTo: destination.label };
}

/** Lead counts per bucket, so a delete can warn before it moves anything. */
export async function getStageCounts() {
  const current = await getCurrentOrg();
  if (!current) return {};
  return stageCounts(current.org.id);
}

export async function getFallbackKey() {
  const current = await getCurrentOrg();
  if (!current) return "new_lead";
  return fallbackStage(await getStages(current.org.id)).key;
}
