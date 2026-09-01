"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { getWritableOrg } from "@/lib/gate";

export type SaveHeadingState = { saved: boolean; error: string | null };

export async function saveFormHeading(
  _prev: SaveHeadingState,
  formData: FormData
): Promise<SaveHeadingState> {
  const { current, error } = await getWritableOrg();
  if (!current) return { saved: false, error };

  // Plain text only. Anything else and this stops being the simple form.
  const heading = String(formData.get("formHeading") ?? "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 80);

  await db
    .update(organizations)
    .set({ formHeading: heading.length > 0 ? heading : null })
    .where(eq(organizations.id, current.org.id));

  revalidatePath("/settings/form");
  return { saved: true, error: null };
}

/**
 * Switch the new-lead email on or off for this team.
 *
 * One toggle rather than a notification preferences screen. There is one
 * thing worth being told about and it is on by default, because a
 * notification nobody switched on never fires, and the lead sitting
 * unnoticed on a board is the failure this product is sold on preventing.
 */
export async function setLeadNotifications(formData: FormData) {
  const { current, error } = await getWritableOrg();
  if (!current) throw new Error(error);

  await db
    .update(organizations)
    .set({ notifyNewLeads: formData.get("on") === "1" })
    .where(eq(organizations.id, current.org.id));

  revalidatePath("/settings/form");
}
