"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import {
  activities,
  activityOutcomeEnum,
  activityTypeEnum,
  leads,
  leadStageEnum,
} from "@/db/schema";
import { getCurrentOrg } from "@/lib/org";
import { normalizePhone } from "@/lib/phone";

export type FormState = { error: string | null };
export type LeadStage = (typeof leadStageEnum.enumValues)[number];

function toNullable(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  return str.length > 0 ? str : null;
}

const STAGE_LABELS: Record<LeadStage, string> = {
  contact: "Contact",
  new_lead: "New Lead",
  contacted: "Contacted",
  proposal_sent: "Proposal Sent",
  won: "Won",
  lost: "Lost",
};

function stageLabel(stage: LeadStage) {
  return STAGE_LABELS[stage] ?? stage;
}

async function requireOrg() {
  const current = await getCurrentOrg();
  if (!current) throw new Error("No organization for the current user.");
  return current;
}

export async function createLead(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const name = toNullable(formData.get("name"));
  if (!name) {
    return { error: "Name is required." };
  }

  const { org } = await requireOrg();

  await db.insert(leads).values({
    orgId: org.id,
    name,
    phone: normalizePhone(toNullable(formData.get("phone"))),
    email: toNullable(formData.get("email")),
    companyName: toNullable(formData.get("companyName")),
    value: toNullable(formData.get("value")),
    stage: (toNullable(formData.get("stage")) as LeadStage) ?? "new_lead",
  });

  revalidatePath("/");
  return { error: null };
}

export async function updateLead(
  id: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const name = toNullable(formData.get("name"));
  if (!name) {
    return { error: "Name is required." };
  }

  const { org } = await requireOrg();

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

  revalidatePath("/");
  return { error: null };
}

export async function updateLeadStage(id: string, stage: LeadStage) {
  const { org } = await requireOrg();

  await db
    .update(leads)
    .set({ stage, updatedAt: new Date() })
    .where(and(eq(leads.id, id), eq(leads.orgId, org.id)));

  revalidatePath("/");
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
        body: `${stageLabel(lead.stage)} → ${stageLabel(stage)}`,
        createdBy: userId,
      });
    }
  });

  revalidatePath("/");
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
    .set({ stage: "new_lead", updatedAt: new Date() })
    .where(and(eq(leads.id, id), eq(leads.orgId, org.id)));

  await db.insert(activities).values({
    orgId: org.id,
    leadId: id,
    type: "stage_change",
    body: "Contact → New Lead",
    createdBy: userId,
  });

  revalidatePath("/");
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
    body: `${stageLabel(lead.stage)} → Contact`,
    createdBy: userId,
  });

  revalidatePath("/");
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
          ilike(leads.phone, like)
        )
      )
    )
    .orderBy(leads.name)
    .limit(8);
}

export async function deleteLead(id: string) {
  const { org } = await requireOrg();

  await db
    .delete(leads)
    .where(and(eq(leads.id, id), eq(leads.orgId, org.id)));

  revalidatePath("/");
}

export type ActivityType = (typeof activityTypeEnum.enumValues)[number];
export type ActivityOutcome = (typeof activityOutcomeEnum.enumValues)[number];

/** Record an interaction (call, email, text, meeting) with an optional note. */
export async function logActivity(
  leadId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const type = (toNullable(formData.get("type")) as ActivityType) ?? "note";
  const outcome = toNullable(formData.get("outcome")) as ActivityOutcome | null;
  const body = toNullable(formData.get("body")) ?? "";

  // A note carries no other information, so it must say something.
  if (type === "note" && !body) {
    return { error: "Add a note before saving." };
  }

  const { org, userId } = await requireOrg();
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
          eq(activities.outcome, "voicemail")
        )
      );
    note = `Left VM #${previous.length + 1}`;
  }

  await db.insert(activities).values({
    orgId: org.id,
    leadId,
    type,
    outcome: keepsOutcome ? outcome : null,
    body: note,
    createdBy: userId,
  });

  revalidatePath("/");
  revalidatePath("/contacts");
  return { error: null };
}

export async function updateActivityNote(
  activityId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const body = toNullable(formData.get("body")) ?? "";
  const { org } = await requireOrg();

  await db
    .update(activities)
    .set({ body })
    .where(and(eq(activities.id, activityId), eq(activities.orgId, org.id)));

  revalidatePath("/");
  revalidatePath("/contacts");
  return { error: null };
}

export async function deleteActivity(activityId: string) {
  const { org } = await requireOrg();

  await db
    .delete(activities)
    .where(and(eq(activities.id, activityId), eq(activities.orgId, org.id)));

  revalidatePath("/");
  revalidatePath("/contacts");
}

export async function addLeadNote(
  leadId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const body = toNullable(formData.get("body"));
  if (!body) {
    return { error: "Note can't be empty." };
  }

  const { org } = await requireOrg();

  await db.insert(activities).values({ orgId: org.id, leadId, body });
  revalidatePath("/");
  return { error: null };
}

export async function setNextAction(
  leadId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const text = toNullable(formData.get("nextActionText"));
  if (!text) {
    return { error: "What's next can't be empty." };
  }

  const { org } = await requireOrg();

  await db
    .update(leads)
    .set({
      nextActionText: text,
      nextActionDue: toNullable(formData.get("nextActionDue")),
      updatedAt: new Date(),
    })
    .where(and(eq(leads.id, leadId), eq(leads.orgId, org.id)));

  revalidatePath("/");
  return { error: null };
}

export async function completeNextAction(
  leadId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const newText = toNullable(formData.get("nextActionText"));
  if (!newText) {
    return { error: "Enter the next action before closing this one out." };
  }

  const { org } = await requireOrg();

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

  revalidatePath("/");
  return { error: null };
}
