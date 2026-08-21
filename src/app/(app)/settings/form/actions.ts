"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { getWritableOrg } from "@/lib/gate";

export async function saveFormHeading(formData: FormData) {
  const { current } = await getWritableOrg();
  if (!current) return;

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
}
