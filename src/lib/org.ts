import { eq } from "drizzle-orm";
import { db } from "@/db";
import { memberships, organizations } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentOrg() {
  const user = await getCurrentUser();
  if (!user) return null;

  const membership = await db.query.memberships.findFirst({
    where: eq(memberships.userId, user.id),
    with: { org: true },
  });

  if (!membership) return null;

  return { org: membership.org, role: membership.role, userId: user.id };
}

export async function createOrgForUser(userId: string, name: string) {
  const [org] = await db.insert(organizations).values({ name }).returning();

  await db.insert(memberships).values({
    orgId: org.id,
    userId,
    role: "owner",
  });

  return org;
}
