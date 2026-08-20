"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { defaultStageKey } from "@/lib/stages";
import { activities, leads, organizations } from "@/db/schema";
import { normalizePhone } from "@/lib/phone";

export type FormState = { error: string | null; done: boolean };

/**
 * Caps on what a stranger can put in the database.
 *
 * This form is public and unauthenticated by design, so nothing else
 * stands between the open internet and an insert. Generous enough that no
 * real person hits them, short enough that nobody stores a novel in the
 * name field.
 */
const LIMITS: Record<string, number> = {
  firstName: 80,
  lastName: 80,
  email: 200,
  phone: 40,
  company: 120,
};

function text(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "")
    .trim()
    .slice(0, LIMITS[key] ?? 200);
  return value.length > 0 ? value : null;
}

export async function submitPublicForm(
  token: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  // Bots fill every field they find. Real people never see this one.
  if (String(formData.get("website") ?? "").trim()) {
    return { error: null, done: true };
  }

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.webhookToken, token),
  });
  if (!org) return { error: "This form is no longer active.", done: false };

  const firstName = text(formData, "firstName");
  const lastName = text(formData, "lastName");
  const email = text(formData, "email");

  if (!firstName || !lastName || !email) {
    return { error: "Please fill in your name and email.", done: false };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "That email address does not look right.", done: false };
  }

  const [lead] = await db
    .insert(leads)
    .values({
      orgId: org.id,
      name: `${firstName} ${lastName}`,
      email,
      phone: normalizePhone(text(formData, "phone")),
      companyName: text(formData, "company"),
      stage: await defaultStageKey(org.id),
    })
    .returning({ id: leads.id });

  // Someone filling out a form is a real signal, so the timeline starts here
  // rather than the lead appearing with no history behind it.
  await db.insert(activities).values({
    orgId: org.id,
    leadId: lead.id,
    type: "form_submission",
    body: "Filled out the form on your website",
  });

  revalidatePath("/pipeline");

  return { error: null, done: true };
}
