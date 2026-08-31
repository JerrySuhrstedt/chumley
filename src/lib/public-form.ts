import { eq } from "drizzle-orm";
import { db } from "@/db";
import { activities, leads, organizations } from "@/db/schema";
import { defaultStageKey } from "@/lib/stages";
import { normalizePhone } from "@/lib/phone";
import { overIngestCap } from "@/lib/ingest-guard";
import { orgOwnerId } from "@/lib/org-owner";

/**
 * One implementation of "a stranger filled in the website form".
 *
 * There are now three doors into this: the hosted page at /f/[token], the
 * script embed, and a raw HTML form posting from the customer's own site.
 * They must behave identically, because the difference between them is
 * presentation and nothing else. Two copies of this logic would drift, and
 * the drift would show up as a lead that landed from one embed and not
 * another, which is close to impossible to diagnose from a support email.
 */

/** Caps on what a stranger can put in the database. */
const LIMITS: Record<string, number> = {
  firstName: 80,
  lastName: 80,
  email: 200,
  phone: 40,
  company: 120,
};

function clean(value: unknown, key: string): string | null {
  const text = String(value ?? "")
    .trim()
    .slice(0, LIMITS[key] ?? 200);
  return text.length > 0 ? text : null;
}

export type PublicFormInput = {
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
  phone?: unknown;
  company?: unknown;
  /** Bots fill in every field they find. Nobody real sees this one. */
  website?: unknown;
};

export type PublicFormResult =
  | { ok: true; error: null }
  | { ok: false; error: string };

export async function submitPublicLead(
  token: string,
  input: PublicFormInput,
): Promise<PublicFormResult> {
  // Silently accept and discard. Telling a bot it was caught only teaches
  // whoever wrote it what to change.
  if (clean(input.website, "website")) return { ok: true, error: null };

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.webhookToken, token),
  });
  if (!org) return { ok: false, error: "This form is no longer active." };

  if (org.deactivatedAt) {
    return { ok: false, error: "This form is no longer active." };
  }

  if (await overIngestCap(org.id)) {
    return {
      ok: false,
      error: "This form is busy right now. Please try again in a while.",
    };
  }

  const firstName = clean(input.firstName, "firstName");
  const lastName = clean(input.lastName, "lastName");
  const email = clean(input.email, "email");

  if (!firstName || !lastName || !email) {
    return { ok: false, error: "Please fill in your name and email." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "That email address does not look right." };
  }

  const [lead] = await db
    .insert(leads)
    .values({
      orgId: org.id,
      ownerId: await orgOwnerId(org.id),
      name: `${firstName} ${lastName}`,
      email,
      phone: normalizePhone(clean(input.phone, "phone")),
      companyName: clean(input.company, "company"),
      stage: await defaultStageKey(org.id),
    })
    .returning({ id: leads.id });

  // Somebody filling in a form is a real signal, so the timeline starts here
  // rather than the lead appearing with no history behind it.
  await db.insert(activities).values({
    orgId: org.id,
    leadId: lead.id,
    type: "form_submission",
    body: "Filled out the form on your website",
  });

  return { ok: true, error: null };
}
