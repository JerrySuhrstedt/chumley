"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { activities, leads } from "@/db/schema";
import { getWritableOrg } from "@/lib/gate";
import { normalizePhone } from "@/lib/phone";
import { defaultStageKey, getStages } from "@/lib/stages";

type LeadStage = string;

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
  notes: string | null;
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
  const { current, error: refused } = await getWritableOrg();
  if (!current) {
    return { inserted: 0, skippedDuplicate: 0, error: refused };
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
            and(
              eq(leads.orgId, current.org.id),
              // Compare lowercased on both sides. The incoming emails are
              // already lowercased, but stored ones may be mixed case, and a
              // raw match would let "Jane@x.com" slip past as not-a-duplicate.
              inArray(sql`lower(${leads.email})`, emails)
            )
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
    // The spreadsheet's idea of a stage is mapped to a key by aliases,
    // which knows nothing about this team's actual board. A key that
    // matches no bucket would produce leads no column draws, so every
    // row is checked against the real list before it is written.
    const valid = new Set((await getStages(current.org.id)).map((s) => s.key));
    const fallback = await defaultStageKey(current.org.id);

    const created = await db
      .insert(leads)
      .values(
        toInsert.map((row) => ({
          orgId: current.org.id,
          ownerId: current.userId,
          name: row.name.trim(),
          companyName: row.companyName,
          // Stored lowercased so the duplicate check above matches it on the
          // next import, and so one person is not two rows over letter case.
          email: row.email ? row.email.trim().toLowerCase() : null,
          phone: normalizePhone(row.phone),
          title: row.title,
          value: row.value,
          stage: valid.has(row.stage) ? row.stage : fallback,
          nextActionText: row.nextActionText,
          nextActionDue: row.nextActionDue,
        }))
      )
      .returning({ id: leads.id });

    // A notes column becomes the lead's first log entry, because notes
    // live in the timeline here, not in a static field. RETURNING keeps
    // insertion order, so rows pair with their new ids by index.
    const noteRows = toInsert
      .map((row, i) => ({ note: row.notes?.trim(), leadId: created[i]?.id }))
      .filter(
        (r): r is { note: string; leadId: string } =>
          Boolean(r.note) && Boolean(r.leadId)
      );

    if (noteRows.length > 0) {
      await db.insert(activities).values(
        noteRows.map((r) => ({
          orgId: current.org.id,
          leadId: r.leadId,
          type: "note" as const,
          body: r.note.slice(0, 4000),
          createdBy: current.userId,
        }))
      );
    }
  }

  revalidatePath("/pipeline");
  revalidatePath("/contacts");

  return { inserted: toInsert.length, skippedDuplicate, error: null };
}
