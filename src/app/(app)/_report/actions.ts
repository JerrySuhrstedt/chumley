"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { problemReports } from "@/db/schema";
import { getCurrentOrg } from "@/lib/org";
import { requireAdmin } from "@/lib/admin";

export type ReportState = { error: string | null; sent: boolean };

/**
 * Somebody telling us something is broken.
 *
 * The browser and the host are read from the request rather than taken
 * from the form, because a hidden field is something a bored person can
 * edit, and a report that lies about where it came from is worse than no
 * report. Only the path is trusted from the client, and only as text.
 */
export async function sendReport(
  _prev: ReportState,
  formData: FormData
): Promise<ReportState> {
  const current = await getCurrentOrg();
  if (!current) return { error: "You need to be signed in.", sent: false };

  const message = String(formData.get("message") ?? "")
    .trim()
    .slice(0, 4000);
  if (message.length < 3) {
    return { error: "Tell us what went wrong first.", sent: false };
  }

  const h = await headers();
  const path = String(formData.get("path") ?? "").slice(0, 500);
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";

  await db.insert(problemReports).values({
    orgId: current.org.id,
    userId: current.userId,
    email: current.email,
    message,
    pageUrl: path ? `${host}${path}` : null,
    userAgent: h.get("user-agent")?.slice(0, 500) ?? null,
  });

  revalidatePath("/admin");
  return { error: null, sent: true };
}

/** Back office only. Marking one read or closed. */
export async function setReportStatus(
  id: string,
  status: "new" | "read" | "closed"
) {
  await requireAdmin();
  await db
    .update(problemReports)
    .set({ status })
    .where(eq(problemReports.id, id));
  revalidatePath("/admin");
  return { error: null };
}
