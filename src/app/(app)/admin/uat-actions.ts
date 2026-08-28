"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { backlogItems, uatTesters } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { scopeBacklogItems } from "@/lib/backlog/scope";

/**
 * Back-office controls for the tester program: the reviewable backlog and
 * personal tester links. Everything gates on requireAdmin before touching
 * a row, same stance as the account controls next door.
 */

const BACKLOG_STATUSES = ["new", "approved", "rejected", "done"] as const;
export type BacklogStatus = (typeof BACKLOG_STATUSES)[number];

export async function setBacklogStatus(
  id: string,
  status: BacklogStatus
): Promise<void> {
  await requireAdmin();
  if (!BACKLOG_STATUSES.includes(status)) return;
  await db
    .update(backlogItems)
    .set({ status, updatedAt: new Date() })
    .where(eq(backlogItems.id, id));
  revalidatePath("/admin");
}

/**
 * Retry scoping for one item, waiting for the result. The submit path
 * scopes in the background because a tester is waiting; here the person
 * waiting is the one who pressed the button, and they want the answer.
 */
export async function rescopeBacklogItem(id: string): Promise<void> {
  await requireAdmin();
  await scopeBacklogItems([id]);
  revalidatePath("/admin");
}

export type CreateTesterResult = { error: string | null };

export async function createUatTester(
  _prev: CreateTesterResult,
  formData: FormData
): Promise<CreateTesterResult> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const email = String(formData.get("email") ?? "").trim().slice(0, 200);
  if (!name) return { error: "The tester needs a name." };
  if (!email.includes("@")) return { error: "That email does not look right." };

  // 8 random bytes base64url: 11 characters, unguessable, short enough to
  // read aloud over the phone if it ever comes to that.
  await db.insert(uatTesters).values({
    token: randomBytes(8).toString("base64url"),
    name,
    email,
  });
  revalidatePath("/admin");
  return { error: null };
}

export async function deleteUatTester(id: string): Promise<void> {
  await requireAdmin();
  // Reports survive: tester_id is ON DELETE SET NULL, so their submitted
  // runs stay in the archive under the name they typed.
  await db.delete(uatTesters).where(eq(uatTesters.id, id));
  revalidatePath("/admin");
}
