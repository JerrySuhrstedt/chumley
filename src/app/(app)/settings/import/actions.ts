"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { leads, leadStageEnum } from "@/db/schema";
import { getCurrentOrg } from "@/lib/org";
import { normalizePhone } from "@/lib/phone";

type LeadStage = (typeof leadStageEnum.enumValues)[number];

export type ImportRow = {
  name: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  value: string | null;
  stage: LeadStage;
  nextActionText: string | null;
  nextActionDue: string | null;
};

export type ImportResult = {
  inserted: number;
  skippedDuplicate: number;
  error: string | null;
};

/**
 * Insert one chunk of mapped rows. The client sends the file in batches so a
 * large import doesn't exceed the server action body limit and can report
 * progress as it goes.
 */
export async function importLeads(
  rows: ImportRow[],
  skipDuplicateEmails: boolean
): Promise<ImportResult> {
  const current = await getCurrentOrg();
  if (!current) {
    return { inserted: 0, skippedDuplicate: 0, error: "No organization." };
  }

  const clean = rows.filter((row) => row.name.trim().length > 0);
  if (clean.length === 0) {
    return { inserted: 0, skippedDuplicate: 0, error: null };
  }

  let toInsert = clean;
  let skippedDuplicate = 0;

  if (skipDuplicateEmails) {
    const emails = clean
      .map((row) => row.email?.trim().toLowerCase())
      .filter((email): email is string => !!email);

    const existing = emails.length
      ? await db
          .select({ email: leads.email })
          .from(leads)
          .where(
            and(eq(leads.orgId, current.org.id), inArray(leads.email, emails))
          )
      : [];

    // Guard against duplicates already in the database and repeats inside
    // this same file.
    const seen = new Set(
      existing
        .map((row) => row.email?.toLowerCase())
        .filter((email): email is string => !!email)
    );

    toInsert = clean.filter((row) => {
      const email = row.email?.trim().toLowerCase();
      if (!email) return true;
      if (seen.has(email)) {
        skippedDuplicate++;
        return false;
      }
      seen.add(email);
      return true;
    });
  }

  if (toInsert.length > 0) {
    await db.insert(leads).values(
      toInsert.map((row) => ({
        orgId: current.org.id,
        name: row.name.trim(),
        companyName: row.companyName,
        email: row.email,
        phone: normalizePhone(row.phone),
        title: row.title,
        value: row.value,
        stage: row.stage,
        nextActionText: row.nextActionText,
        nextActionDue: row.nextActionDue,
      }))
    );
  }

  revalidatePath("/");
  revalidatePath("/contacts");

  return { inserted: toInsert.length, skippedDuplicate, error: null };
}
