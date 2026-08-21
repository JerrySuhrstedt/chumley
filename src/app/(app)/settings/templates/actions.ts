"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { templates, templateChannelEnum } from "@/db/schema";
import { getWritableOrg } from "@/lib/gate";

export type FormState = { error: string | null };
type Channel = (typeof templateChannelEnum.enumValues)[number];

function read(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const channel = String(formData.get("channel") ?? "") as Channel;
  return { name, body, subject, channel };
}

export async function createTemplate(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { name, body, subject, channel } = read(formData);

  if (!name || !body) {
    return { error: "Give it a name and a message." };
  }

  const { current, error: refused } = await getWritableOrg();
  if (!current) return { error: refused };

  await db.insert(templates).values({
    orgId: current.org.id,
    name,
    body,
    channel,
    // Texts have no subject, so never store one against them.
    subject: channel === "email" && subject ? subject : null,
  });

  revalidatePath("/settings/templates");
  revalidatePath("/pipeline");
  return { error: null };
}

export async function updateTemplate(
  id: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { name, body, subject, channel } = read(formData);

  if (!name || !body) {
    return { error: "Give it a name and a message." };
  }

  const { current, error: refused } = await getWritableOrg();
  if (!current) return { error: refused };

  await db
    .update(templates)
    .set({
      name,
      body,
      channel,
      subject: channel === "email" && subject ? subject : null,
    })
    .where(and(eq(templates.id, id), eq(templates.orgId, current.org.id)));

  revalidatePath("/settings/templates");
  revalidatePath("/pipeline");
  return { error: null };
}

export async function deleteTemplate(id: string) {
  const { current } = await getWritableOrg();
  if (!current) return;

  await db
    .delete(templates)
    .where(and(eq(templates.id, id), eq(templates.orgId, current.org.id)));

  revalidatePath("/settings/templates");
  revalidatePath("/pipeline");
}
