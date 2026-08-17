"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { activities, deals, dealStageEnum } from "@/db/schema";

export type FormState = { error: string | null };
export type DealStage = (typeof dealStageEnum.enumValues)[number];

function toNullable(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  return str.length > 0 ? str : null;
}

export async function createDeal(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const name = toNullable(formData.get("name"));
  if (!name) {
    return { error: "Deal name is required." };
  }

  await db.insert(deals).values({
    name,
    contactId: toNullable(formData.get("contactId")),
    companyId: toNullable(formData.get("companyId")),
    amount: toNullable(formData.get("amount")),
    closeDate: toNullable(formData.get("closeDate")),
    stage: (toNullable(formData.get("stage")) as DealStage) ?? "lead",
  });

  revalidatePath("/deals");
  return { error: null };
}

export async function updateDeal(
  id: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const name = toNullable(formData.get("name"));
  if (!name) {
    return { error: "Deal name is required." };
  }

  await db
    .update(deals)
    .set({
      name,
      contactId: toNullable(formData.get("contactId")),
      companyId: toNullable(formData.get("companyId")),
      amount: toNullable(formData.get("amount")),
      closeDate: toNullable(formData.get("closeDate")),
      stage: (toNullable(formData.get("stage")) as DealStage) ?? "lead",
      updatedAt: new Date(),
    })
    .where(eq(deals.id, id));

  revalidatePath("/deals");
  return { error: null };
}

export async function updateDealStage(id: string, stage: DealStage) {
  await db
    .update(deals)
    .set({ stage, updatedAt: new Date() })
    .where(eq(deals.id, id));

  revalidatePath("/deals");
}

export async function deleteDeal(id: string) {
  await db.delete(deals).where(eq(deals.id, id));
  revalidatePath("/deals");
}

export async function addDealNote(
  dealId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const body = toNullable(formData.get("body"));
  if (!body) {
    return { error: "Note can't be empty." };
  }

  await db.insert(activities).values({ type: "note", body, dealId });
  revalidatePath("/deals");
  return { error: null };
}
