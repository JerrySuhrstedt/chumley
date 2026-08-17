"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { memberships, orgInvites } from "@/db/schema";
import { getCurrentOrg } from "@/lib/org";

export async function getOrCreateInviteToken() {
  const current = await getCurrentOrg();
  if (!current) throw new Error("No organization.");

  const existing = await db.query.orgInvites.findFirst({
    where: eq(orgInvites.orgId, current.org.id),
  });

  if (existing) return existing.token;

  const token = crypto.randomUUID();
  await db.insert(orgInvites).values({
    orgId: current.org.id,
    token,
    createdBy: current.userId,
  });

  return token;
}

export async function removeMember(membershipId: string) {
  const current = await getCurrentOrg();
  if (!current || current.role !== "owner") {
    return { error: "Only the team owner can remove members." };
  }

  await db
    .delete(memberships)
    .where(
      and(
        eq(memberships.id, membershipId),
        eq(memberships.orgId, current.org.id)
      )
    );

  revalidatePath("/settings/team");
  return { error: null };
}
