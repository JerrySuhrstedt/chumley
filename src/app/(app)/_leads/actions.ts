"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { activities, leads, leadStageEnum } from "@/db/schema";
import { getCurrentOrg } from "@/lib/org";

export type FormState = { error: string | null };
export type LeadStage = (typeof leadStageEnum.enumValues)[number];

function toNullable(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  return str.length > 0 ? str : null;
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
    phone: toNullable(formData.get("phone")),
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
      phone: toNullable(formData.get("phone")),
      email: toNullable(formData.get("email")),
      companyName: toNullable(formData.get("companyName")),
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

export async function deleteLead(id: string) {
  const { org } = await requireOrg();

  await db
    .delete(leads)
    .where(and(eq(leads.id, id), eq(leads.orgId, org.id)));

  revalidatePath("/");
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
