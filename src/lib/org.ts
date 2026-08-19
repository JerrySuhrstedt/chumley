import { eq } from "drizzle-orm";
import { db } from "@/db";
import { memberships, organizations, templates } from "@/db/schema";
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

/**
 * Starter messages. The tap-to-text and tap-to-email buttons pre-fill from
 * these, and a brand new team has none, so the feature looks broken until
 * somebody stumbles into Settings. Seeding two means it works on day one.
 */
const STARTER_TEMPLATES = [
  {
    channel: "sms" as const,
    name: "Quick follow up",
    body: "Hi {{name}}, following up on our conversation. Anything I can answer for you?",
  },
  {
    channel: "email" as const,
    name: "Nice talking today",
    body: "Hi {{name}},\n\nGood talking with you today. I will get that information over shortly.\n\nThanks",
  },
];

export async function createOrgForUser(userId: string, name: string) {
  const [org] = await db.insert(organizations).values({ name }).returning();

  await db.insert(memberships).values({
    orgId: org.id,
    userId,
    role: "owner",
  });

  await db
    .insert(templates)
    .values(STARTER_TEMPLATES.map((t) => ({ ...t, orgId: org.id })));

  return org;
}
