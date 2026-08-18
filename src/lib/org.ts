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

  // Google (and any other OAuth provider) hands back a photo at sign-in.
  // A photo saved on the profile wins; otherwise fall back to that one.
  const providerPhoto =
    (user.user_metadata?.avatar_url as string | undefined) ??
    (user.user_metadata?.picture as string | undefined) ??
    null;

  return {
    org: membership.org,
    role: membership.role,
    userId: user.id,
    email: user.email ?? null,
    displayName: membership.displayName,
    jobTitle: membership.jobTitle,
    linkedinUrl: membership.linkedinUrl,
    // What was actually chosen and stored. Null means "use whatever the
    // sign-in account supplied", and the form must show it as empty.
    savedAvatarUrl: membership.avatarUrl,
    // What to render. Never feed this back into the form's default value.
    avatarUrl: membership.avatarUrl ?? providerPhoto,
    providerPhoto,
  };
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
