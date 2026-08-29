"use server";

import { revalidatePath } from "next/cache";
import { and, count, eq } from "drizzle-orm";
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

  // Never let the team lose its last owner. The UI hides the button for
  // yourself, but a direct action call could otherwise delete the sole
  // owner's membership and strand an ownerless team that can never invite
  // or manage anyone again while it keeps billing.
  const [target] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(
      and(
        eq(memberships.id, membershipId),
        eq(memberships.orgId, current.org.id)
      )
    )
    .limit(1);
  if (!target) return { error: "That member is already gone." };
  if (target.role === "owner") {
    const [owners] = await db
      .select({ n: count() })
      .from(memberships)
      .where(
        and(
          eq(memberships.orgId, current.org.id),
          eq(memberships.role, "owner")
        )
      );
    if (Number(owners?.n ?? 0) <= 1) {
      return {
        error:
          "You're the only owner. Make someone else an owner before you leave.",
      };
    }
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
