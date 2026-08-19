import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leads, memberships, organizations, templates } from "@/db/schema";
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
    subject: null,
    name: "Quick follow up",
    body: "Hi {{name}}, following up on our conversation. Anything I can answer for you?",
  },
  {
    channel: "email" as const,
    name: "Nice talking today",
    subject: "Following up on our conversation",
    body: "Hi {{name}},\n\nGood talking with you today. I will get that information over shortly.\n\nThanks",
  },
];

/**
 * Three deals to poke at on day one.
 *
 * A board explaining what to do is weaker than a board already doing it,
 * so these arrive in different buckets, at different temperatures, with a
 * next step that is late, one due today and one still ahead. Phone numbers
 * are 555, which is reserved for fiction, so a stray tap cannot reach a
 * real person.
 */
function starterLeads(orgId: string) {
  const day = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };

  return [
    {
      orgId,
      isSample: true,
      name: "Dale Whitaker",
      companyName: "Whitaker Mechanical",
      email: "dale@example.com",
      phone: "(555) 014-2200",
      value: "8500.00",
      stage: "new_lead" as const,
      temperature: "warm" as const,
      nextActionText: "Call to introduce yourself",
      nextActionDue: day(0),
      position: 0,
    },
    {
      orgId,
      isSample: true,
      name: "Rosa Nunez",
      companyName: "Copper Ridge Builders",
      email: "rosa@example.com",
      phone: "(555) 014-2201",
      value: "21000.00",
      stage: "contacted" as const,
      temperature: "hot" as const,
      nextActionText: "Send the quote she asked for",
      nextActionDue: day(2),
      position: 0,
    },
    {
      orgId,
      isSample: true,
      name: "Marcus Hall",
      companyName: "Hall & Sons Plumbing",
      email: "marcus@example.com",
      phone: "(555) 014-2202",
      value: "34000.00",
      stage: "proposal_sent" as const,
      temperature: "cold" as const,
      nextActionText: "Follow up, he has gone quiet",
      nextActionDue: day(-3),
      position: 0,
    },
  ];
}

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

  await db.insert(leads).values(starterLeads(org.id));

  return org;
}
