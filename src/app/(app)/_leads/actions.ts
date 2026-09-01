"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import {
  activities,
  activityOutcomeEnum,
  activityTypeEnum,
  leads,
} from "@/db/schema";
import { getCurrentOrg } from "@/lib/org";
import { getWritableOrg, requireWritableOrg } from "@/lib/gate";
import { normalizePhone } from "@/lib/phone";
import { defaultStageKey, resolveStageKey } from "@/lib/stages";

export type FormState = { error: string | null };
/**
 * A bucket key. Free text now that teams can invent their own, so this is
 * documentation rather than a constraint the compiler can enforce.
 */
export type LeadStage = string;

function toNullable(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  return str.length > 0 ? str : null;
}

const STAGE_LABELS: Record<string, string> = {
  contact: "Contact",
  new_lead: "New Lead",
  contacted: "Contacted",
  proposal_sent: "Proposal Sent",
  won: "Won",
  lost: "Lost",
};

/**
 * A readable name for a bucket, for the activity log.
 *
 * Reads the team's own name where there is one, so "moved to Site Visit"
 * is recorded rather than "moved to c_site_visit". Falls back to the
 * seeded names, then to the key itself, so a deleted bucket still leaves
 * a legible history.
 */
async function stageLabel(orgId: string, stage: LeadStage) {
  const { getStages } = await import("@/lib/stages");
  const found = (await getStages(orgId)).find((s) => s.key === stage);
  return found?.label ?? STAGE_LABELS[stage] ?? stage;
}

/**
 * The team, and permission to change its data.
 *
 * Every write below goes through the gate rather than through
 * getCurrentOrg, so a team whose plan has ended keeps its board and can
 * no longer edit it. Reads are untouched: searchLeads still calls
 * getCurrentOrg directly.
 *
 * Two shapes, because the actions have two. Anything returning a
 * FormState uses getWritableOrg and hands the reason back to the form
 * that will display it. The ones returning nothing throw instead, and
 * the board catches that and reloads rather than leaving a card sitting
 * somewhere it was never saved.
 */
async function requireOrg() {
  return requireWritableOrg();
}

/**
 * A lead belongs to this team, or it does not exist for us.
 *
 * Every activity insert takes a `leadId` straight off the browser, and a
 * server action is reachable by anyone with a session, so without this a
 * signed-in user holding another team's lead id could write onto that
 * team's timeline. `logActivity`/`logCallTouch` inline this check; the
 * two note/message writers that skipped it now share this helper.
 */
async function ownsLead(orgId: string, leadId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: leads.id })
    .from(leads)
    .where(and(eq(leads.id, leadId), eq(leads.orgId, orgId)))
    .limit(1);
  return Boolean(row);
}

export type CreateLeadState = FormState & {
  /**
   * The row that was just made, so the board can point at it: switch the
   * mobile view to its bucket, drop filters that would hide it, flash it.
   * The save was never the problem; the card being invisible was.
   */
  lead?: { id: string; name: string; stage: string } | null;
};

export async function createLead(
  _prevState: CreateLeadState,
  formData: FormData,
): Promise<CreateLeadState> {
  const name = toNullable(formData.get("name"));
  if (!name) {
    return { error: "Name is required." };
  }

  const { current, error: refused } = await getWritableOrg();
  if (!current) return { error: refused };
  const { org } = current;

  const [row] = await db
    .insert(leads)
    .values({
      orgId: org.id,
      // Whoever typed it in works it, until somebody says otherwise.
      ownerId: current.userId,
      name,
      phone: normalizePhone(toNullable(formData.get("phone"))),
      email: toNullable(formData.get("email")),
      companyName: toNullable(formData.get("companyName")),
      value: toNullable(formData.get("value")),
      stage: await resolveStageKey(org.id, toNullable(formData.get("stage"))),
    })
    .returning({ id: leads.id, name: leads.name, stage: leads.stage });

  revalidatePath("/pipeline");
  // A new contact lands off the board, so that list has to refresh too.
  revalidatePath("/contacts");
  return { error: null, lead: row ?? null };
}

export async function updateLead(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = toNullable(formData.get("name"));
  if (!name) {
    return { error: "Name is required." };
  }

  const { current, error: refused } = await getWritableOrg();
  if (!current) return { error: refused };
  const { org } = current;

  await db
    .update(leads)
    .set({
      name,
      phone: normalizePhone(toNullable(formData.get("phone"))),
      email: toNullable(formData.get("email")),
      companyName: toNullable(formData.get("companyName")),
      title: toNullable(formData.get("title")),
      value: toNullable(formData.get("value")),
      updatedAt: new Date(),
    })
    .where(and(eq(leads.id, id), eq(leads.orgId, org.id)));

  revalidatePath("/pipeline");
  return { error: null };
}

export async function updateLeadStage(id: string, stage: LeadStage) {
  const { org } = await requireOrg();

  // The stage arrives as a bare string from the client. resolveStageKey
  // pins anything the team does not actually have to its first bucket, so
  // a tampered request can't park a lead on a key no column renders,
  // where it goes invisible and is unrecoverable from the UI.
  const resolved = await resolveStageKey(org.id, stage);

  await db
    .update(leads)
    .set({ stage: resolved, updatedAt: new Date() })
    .where(and(eq(leads.id, id), eq(leads.orgId, org.id)));

  revalidatePath("/pipeline");
}

/**
 * Persist the full order of one stage's column after a drag. Passing the whole
 * ordered list keeps positions contiguous and also moves the dragged card into
 * this stage, so a cross-column drop is a single write.
 */
export async function reorderStage(stage: LeadStage, orderedIds: string[]) {
  if (orderedIds.length === 0) return;

  const { org, userId } = await requireOrg();

  // Stage transitions are a touchpoint worth keeping — they're how pipeline
  // velocity gets measured — so record the ones that actually changed.
  const existing = await db
    .select({ id: leads.id, name: leads.name, stage: leads.stage })
    .from(leads)
    .where(and(eq(leads.orgId, org.id), inArray(leads.id, orderedIds)));

  const moved = existing.filter((lead) => lead.stage !== stage);

  // Bucket names, resolved once. Looking each one up inside the
  // transaction would hold it open for the length of a round trip per row.
  const { getStages } = await import("@/lib/stages");
  const names = Object.fromEntries(
    (await getStages(org.id)).map((s) => [s.key, s.label]),
  );

  // The destination must be one this team actually has. Without this a
  // tampered request could strand every listed lead on a bogus key that
  // no column renders and no UI can rescue.
  if (!names[stage]) return;

  await db.transaction(async (tx) => {
    for (const [index, id] of orderedIds.entries()) {
      await tx
        .update(leads)
        .set({ stage, position: index, updatedAt: new Date() })
        .where(and(eq(leads.id, id), eq(leads.orgId, org.id)));
    }

    for (const lead of moved) {
      await tx.insert(activities).values({
        orgId: org.id,
        leadId: lead.id,
        type: "stage_change",
        body: `${names[lead.stage] ?? lead.stage} → ${names[stage] ?? stage}`,
        createdBy: userId,
      });
    }
  });

  revalidatePath("/pipeline");
  revalidatePath("/contacts");
}

/**
 * Move a contact onto the board. This is the moment a contact becomes a lead,
 * so it's recorded on the timeline like any other stage change.
 */
export async function addToPipeline(id: string) {
  const { org, userId } = await requireOrg();

  const [lead] = await db
    .select({ id: leads.id, stage: leads.stage })
    .from(leads)
    .where(and(eq(leads.id, id), eq(leads.orgId, org.id)));

  if (!lead || lead.stage !== "contact") return;

  await db
    .update(leads)
    .set({ stage: await defaultStageKey(org.id), updatedAt: new Date() })
    .where(and(eq(leads.id, id), eq(leads.orgId, org.id)));

  await db.insert(activities).values({
    orgId: org.id,
    leadId: id,
    type: "stage_change",
    body: "Contact → New Lead",
    createdBy: userId,
  });

  revalidatePath("/pipeline");
  revalidatePath("/contacts");
}

/** Take a lead off the board without deleting the person. */
export async function removeFromPipeline(id: string) {
  const { org, userId } = await requireOrg();

  const [lead] = await db
    .select({ id: leads.id, stage: leads.stage })
    .from(leads)
    .where(and(eq(leads.id, id), eq(leads.orgId, org.id)));

  if (!lead || lead.stage === "contact") return;

  await db
    .update(leads)
    .set({ stage: "contact", updatedAt: new Date() })
    .where(and(eq(leads.id, id), eq(leads.orgId, org.id)));

  await db.insert(activities).values({
    orgId: org.id,
    leadId: id,
    type: "stage_change",
    body: `${await stageLabel(org.id, lead.stage)} → Contact`,
    createdBy: userId,
  });

  revalidatePath("/pipeline");
  revalidatePath("/contacts");
}

export type SearchHit = {
  id: string;
  name: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  stage: LeadStage;
};

/** Header search across people, companies, emails and phone numbers. */
export async function searchLeads(query: string): Promise<SearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const current = await getCurrentOrg();
  if (!current) return [];

  const like = `%${q}%`;

  return db
    .select({
      id: leads.id,
      name: leads.name,
      companyName: leads.companyName,
      email: leads.email,
      phone: leads.phone,
      avatarUrl: leads.avatarUrl,
      stage: leads.stage,
    })
    .from(leads)
    .where(
      and(
        eq(leads.orgId, current.org.id),
        or(
          ilike(leads.name, like),
          ilike(leads.companyName, like),
          ilike(leads.email, like),
          ilike(leads.phone, like),
        ),
      ),
    )
    .orderBy(leads.name)
    .limit(8);
}

export async function deleteLead(id: string) {
  const { org } = await requireOrg();

  await db.delete(leads).where(and(eq(leads.id, id), eq(leads.orgId, org.id)));

  revalidatePath("/pipeline");
}

export type ActivityType = (typeof activityTypeEnum.enumValues)[number];
export type ActivityOutcome = (typeof activityOutcomeEnum.enumValues)[number];

/**
 * Record an interaction (call, email, text, meeting) with an optional note.
 * Returns the id so the caller can offer an undo, which matters now that
 * the logger commits on the way out as well as on the button.
 */
export async function logActivity(
  leadId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState & { activityId?: string | null }> {
  const type = (toNullable(formData.get("type")) as ActivityType) ?? "note";
  const outcome = toNullable(formData.get("outcome")) as ActivityOutcome | null;
  const body = toNullable(formData.get("body")) ?? "";

  // A note carries no other information, so it must say something.
  if (type === "note" && !body) {
    return { error: "Add a note before saving." };
  }

  const { current, error: refused } = await getWritableOrg();
  if (!current) return { error: refused };
  const { org, userId } = current;

  // The lead has to belong to this team. A server action is callable by
  // anyone who can reach the site, and leadId arrives from the browser.
  const [lead] = await db
    .select({ id: leads.id })
    .from(leads)
    .where(and(eq(leads.id, leadId), eq(leads.orgId, org.id)))
    .limit(1);
  if (!lead) return { error: "That lead is gone." };

  const keepsOutcome = type === "call" || type === "meeting";

  // Voicemails are a cadence counter — number them so a rep can see where
  // they are in the sequence without reading the whole timeline.
  let note = body;
  if (type === "call" && outcome === "voicemail" && !note) {
    const previous = await db
      .select({ id: activities.id })
      .from(activities)
      .where(
        and(
          eq(activities.orgId, org.id),
          eq(activities.leadId, leadId),
          eq(activities.outcome, "voicemail"),
        ),
      );
    note = `Left VM #${previous.length + 1}`;
  }

  const [row] = await db
    .insert(activities)
    .values({
      orgId: org.id,
      leadId,
      type,
      outcome: keepsOutcome ? outcome : null,
      body: note,
      createdBy: userId,
    })
    .returning({ id: activities.id });

  revalidatePath("/pipeline");
  revalidatePath("/contacts");
  return { error: null, activityId: row?.id ?? null };
}

/**
 * Log a call the instant it is dialled.
 *
 * The gap this closes: tapping Call already told us who, what and when, and
 * the app then waited to be given permission to write it down. A rep who
 * finishes the call in a truck and drives off never gives that permission,
 * so the interaction is lost and the pipeline quietly stops matching
 * reality. Text and email have always logged themselves on send; calling
 * was the one that did not.
 *
 * Written with no outcome on purpose. The disposition is asked for
 * afterwards, when the rep actually knows it, and the row exists either way.
 * An unanswered "how did it go" is a worse outcome than a call logged
 * without one.
 *
 * Returns the id so the caller can offer an undo and hang the note and the
 * outcome off the same row rather than creating a second.
 */
export async function logCallTouch(
  leadId: string,
): Promise<{ activityId: string | null; error: string | null }> {
  const { current, error: refused } = await getWritableOrg();
  if (!current) return { activityId: null, error: refused };
  const { org, userId } = current;

  // The lead has to belong to this team. A server action is callable by
  // anyone who can reach the site, and leadId arrives from the browser.
  const [lead] = await db
    .select({ id: leads.id })
    .from(leads)
    .where(and(eq(leads.id, leadId), eq(leads.orgId, org.id)))
    .limit(1);
  if (!lead) return { activityId: null, error: "That lead is gone." };

  const [row] = await db
    .insert(activities)
    .values({ orgId: org.id, leadId, type: "call", createdBy: userId })
    .returning({ id: activities.id });

  revalidatePath("/pipeline");
  revalidatePath("/contacts");
  return { activityId: row?.id ?? null, error: null };
}

/**
 * Set how a call went, after the fact.
 *
 * A voicemail gets numbered the same way the manual logger numbers them, so
 * the two routes into the timeline do not produce differently shaped rows
 * for the same event.
 */
export async function setActivityOutcome(
  activityId: string,
  outcome: ActivityOutcome,
): Promise<{ error: string | null }> {
  const { current, error: refused } = await getWritableOrg();
  if (!current) return { error: refused };
  const { org } = current;

  const [row] = await db
    .select({ leadId: activities.leadId, body: activities.body })
    .from(activities)
    .where(and(eq(activities.id, activityId), eq(activities.orgId, org.id)))
    .limit(1);
  if (!row) return { error: "That entry is gone." };

  let body = row.body;
  if (outcome === "voicemail" && !body) {
    const previous = await db
      .select({ id: activities.id })
      .from(activities)
      .where(
        and(
          eq(activities.orgId, org.id),
          eq(activities.leadId, row.leadId),
          eq(activities.outcome, "voicemail"),
        ),
      );
    body = `Left VM #${previous.length + 1}`;
  }

  await db
    .update(activities)
    .set({ outcome, body })
    .where(and(eq(activities.id, activityId), eq(activities.orgId, org.id)));

  revalidatePath("/pipeline");
  revalidatePath("/contacts");
  return { error: null };
}

/** The wrap-up line, saved against a row that already exists. */
export async function setActivityNote(
  activityId: string,
  body: string,
): Promise<{ error: string | null }> {
  const { current, error: refused } = await getWritableOrg();
  if (!current) return { error: refused };
  const { org } = current;

  await db
    .update(activities)
    .set({ body: body.trim().slice(0, 2000) })
    .where(and(eq(activities.id, activityId), eq(activities.orgId, org.id)));

  revalidatePath("/pipeline");
  revalidatePath("/contacts");
  return { error: null };
}

export async function deleteActivity(activityId: string) {
  const { org } = await requireOrg();

  await db
    .delete(activities)
    .where(and(eq(activities.id, activityId), eq(activities.orgId, org.id)));

  revalidatePath("/pipeline");
  revalidatePath("/contacts");
}

export async function addLeadNote(
  leadId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const body = toNullable(formData.get("body"));
  if (!body) {
    return { error: "Note can't be empty." };
  }

  const { current, error: refused } = await getWritableOrg();
  if (!current) return { error: refused };
  const { org } = current;

  if (!(await ownsLead(org.id, leadId))) return { error: "That lead is gone." };

  await db.insert(activities).values({ orgId: org.id, leadId, body });
  revalidatePath("/pipeline");
  return { error: null };
}

export async function setNextAction(
  leadId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const text = toNullable(formData.get("nextActionText"));
  if (!text) {
    return { error: "What's next can't be empty." };
  }

  const { current, error: refused } = await getWritableOrg();
  if (!current) return { error: refused };
  const { org } = current;

  await db
    .update(leads)
    .set({
      nextActionText: text,
      nextActionDue: toNullable(formData.get("nextActionDue")),
      updatedAt: new Date(),
    })
    .where(and(eq(leads.id, leadId), eq(leads.orgId, org.id)));

  revalidatePath("/pipeline");
  return { error: null };
}

export async function completeNextAction(
  leadId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const newText = toNullable(formData.get("nextActionText"));
  if (!newText) {
    return { error: "Enter the next action before closing this one out." };
  }

  const { current, error: refused } = await getWritableOrg();
  if (!current) return { error: refused };
  const { org } = current;

  const lead = await db.query.leads.findFirst({
    where: and(eq(leads.id, leadId), eq(leads.orgId, org.id)),
  });

  if (lead?.nextActionText) {
    await db.insert(activities).values({
      orgId: org.id,
      leadId,
      body: `Done: ${lead.nextActionText}`,
    });
  }

  await db
    .update(leads)
    .set({
      nextActionText: newText,
      nextActionDue: toNullable(formData.get("nextActionDue")),
      updatedAt: new Date(),
    })
    .where(and(eq(leads.id, leadId), eq(leads.orgId, org.id)));

  revalidatePath("/pipeline");
  return { error: null };
}

/**
 * Records a text or email at the moment it is handed to the phone or the
 * mail client.
 *
 * That hand-off is the last thing Chumley can observe: the message is sent
 * from the user's own number or address, so there is no delivery receipt
 * coming back. Logging on hand-off is therefore a record of what was
 * written and when, not proof it left. A rep who changes their mind can
 * delete the entry from the timeline.
 */
export async function logSentMessage(
  leadId: string,
  channel: "text" | "email",
  body: string,
) {
  const { org, userId } = await requireOrg();

  // Same ownership gate as every other activity write. Without it a
  // fabricated text/email touchpoint could be planted on another team's
  // lead. The board catches a throw and reloads.
  if (!(await ownsLead(org.id, leadId))) {
    throw new Error("That lead is gone.");
  }

  await db.insert(activities).values({
    orgId: org.id,
    leadId,
    type: channel,
    body: body.trim().slice(0, 2000),
    createdBy: userId,
  });

  revalidatePath("/pipeline");
  revalidatePath("/contacts");
}

export type LeadTemperature = "hot" | "warm" | "cold";

/**
 * Set or clear how warm a lead feels.
 *
 * Passing the value that is already set clears it, so the control toggles
 * rather than trapping somebody who tapped the wrong one.
 */
export async function setTemperature(
  leadId: string,
  value: LeadTemperature | null,
) {
  const { org } = await requireOrg();

  await db
    .update(leads)
    .set({ temperature: value, updatedAt: new Date() })
    .where(and(eq(leads.id, leadId), eq(leads.orgId, org.id)));

  revalidatePath("/pipeline");
  revalidatePath("/contacts");
}

/** Wipe the three demo deals a new team starts with. */
export async function clearSamples() {
  const { org } = await requireOrg();

  await db
    .delete(leads)
    .where(and(eq(leads.orgId, org.id), eq(leads.isSample, true)));

  revalidatePath("/pipeline");
  revalidatePath("/contacts");
}


/**
 * Hand a deal to a teammate.
 *
 * The new owner must be on this team, checked here rather than trusted
 * from the picker, because a server action is an API whether or not a
 * dropdown was involved.
 */
export async function setLeadOwner(leadId: string, newOwnerId: string) {
  const { org, userId, role } = await requireOrg();

  // The team owner moves anything; everyone else hands off their own.
  // Without this, a rep could quietly take a teammate's deal, which is
  // how commission arguments get started.
  if (role !== "owner") {
    const [current] = await db
      .select({ ownerId: leads.ownerId })
      .from(leads)
      .where(and(eq(leads.id, leadId), eq(leads.orgId, org.id)));
    if (!current) throw new Error("That lead is gone.");
    if (current.ownerId !== null && current.ownerId !== userId) {
      throw new Error("Only the team owner can reassign someone else's lead.");
    }
  }

  const { memberships } = await import("@/db/schema");
  const member = await db.query.memberships.findFirst({
    where: and(
      eq(memberships.orgId, org.id),
      eq(memberships.userId, newOwnerId)
    ),
  });
  if (!member) throw new Error("That person is not on this team.");

  await db
    .update(leads)
    .set({ ownerId: newOwnerId })
    .where(and(eq(leads.id, leadId), eq(leads.orgId, org.id)));

  revalidatePath("/pipeline");
}
