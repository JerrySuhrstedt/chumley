"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { memberships, orgInvites } from "@/db/schema";
import { getCurrentUser } from "@/lib/org";

export async function joinOrg(token: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You need to be signed in." as const };
  }

  const invite = await db.query.orgInvites.findFirst({
    where: eq(orgInvites.token, token),
  });

  if (!invite) {
    return { error: "This invite link is invalid." as const };
  }

  const existing = await db.query.memberships.findFirst({
    where: eq(memberships.userId, user.id),
  });

  if (existing) {
    return {
      error:
        existing.orgId === invite.orgId
          ? null
          : ("You're already on a different team." as const),
    };
  }

  await db.insert(memberships).values({
    orgId: invite.orgId,
    userId: user.id,
    role: "member",
  });

  return { error: null };
}
