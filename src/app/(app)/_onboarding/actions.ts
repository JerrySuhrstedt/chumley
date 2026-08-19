"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { memberships } from "@/db/schema";
import { getCurrentOrg } from "@/lib/org";

export type NameState = { error: string | null };

export async function saveName(
  _prev: NameState,
  formData: FormData
): Promise<NameState> {
  const first = String(formData.get("firstName") ?? "").trim();
  const last = String(formData.get("lastName") ?? "").trim();

  if (!first) return { error: "A first name is enough to go on." };

  const current = await getCurrentOrg();
  if (!current) return { error: "No team found." };

  await db
    .update(memberships)
    .set({ displayName: [first, last].filter(Boolean).join(" ") })
    .where(
      and(
        eq(memberships.orgId, current.org.id),
        eq(memberships.userId, current.userId)
      )
    );

  revalidatePath("/", "layout");
  return { error: null };
}
