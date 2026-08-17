"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { templates, templateChannelEnum } from "@/db/schema";
import { getCurrentOrg } from "@/lib/org";

export type FormState = { error: string | null };
type Channel = (typeof templateChannelEnum.enumValues)[number];

export async function createTemplate(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const channel = String(formData.get("channel") ?? "") as Channel;

  if (!name || !body) {
    return { error: "Name and message are required." };
  }

  const current = await getCurrentOrg();
  if (!current) return { error: "No organization." };

  await db.insert(templates).values({ orgId: current.org.id, name, body, channel });
  revalidatePath("/settings/templates");
  return { error: null };
}

export async function deleteTemplate(id: string) {
  const current = await getCurrentOrg();
  if (!current) return;

  await db
    .delete(templates)
    .where(and(eq(templates.id, id), eq(templates.orgId, current.org.id)));

  revalidatePath("/settings/templates");
}
