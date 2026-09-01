"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { memberships, orgInvites } from "@/db/schema";
import { getCurrentUser } from "@/lib/org";
import { seatCheck } from "@/lib/gate";

/**
 * Look at an invite without acting on it. The page uses this to render a
 * confirmation rather than joining on sight: joining during a GET meant a
 * browser prerender or an address-bar preload could bind a signed-in user
 * to a team they never chose, and there is no "leave team" to undo it.
 */
export async function inspectInvite(token: string): Promise<
  | { state: "invalid" }
  | { state: "signed-out" }
  | { state: "already-here" }
  | { state: "other-team" }
  | { state: "ready"; orgName: string }
> {
  const user = await getCurrentUser();
  if (!user) return { state: "signed-out" };

  const invite = await db.query.orgInvites.findFirst({
    where: eq(orgInvites.token, token),
    with: { org: true },
  });
  if (!invite) return { state: "invalid" };

  const existing = await db.query.memberships.findFirst({
    where: eq(memberships.userId, user.id),
  });
  if (existing) {
    return existing.orgId === invite.orgId
      ? { state: "already-here" }
      : { state: "other-team" };
  }

  return { state: "ready", orgName: invite.org.name };
}

export type JoinState = { error: string | null };

/**
 * Accept an invite. A form action now, not a render-time call: the write
 * belongs to a POST, and revalidatePath (below) throws outright if it runs
 * during render, which is why every successful join used to end on the
 * error page.
 */
export async function joinOrg(
  token: string,
  _prev: JoinState,
  _formData: FormData
): Promise<JoinState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You need to be signed in." };
  }

  const invite = await db.query.orgInvites.findFirst({
    where: eq(orgInvites.token, token),
  });
  if (!invite) {
    return { error: "This invite link is invalid." };
  }

  const existing = await db.query.memberships.findFirst({
    where: eq(memberships.userId, user.id),
  });
  if (existing) {
    if (existing.orgId === invite.orgId) redirect("/pipeline");
    return { error: "You're already on a different team." };
  }

  const seats = await seatCheck(invite.orgId);
  if (!seats.ok) return { error: seats.error };

  const { cap } = seats;
  try {
    await db.transaction(async (tx) => {
      // Serialize joins per org. The seat limit is a count, and a row
      // lock protects a row, not a count; two people opening the same
      // link at once would both read a free seat and both commit. A
      // transaction-scoped advisory lock is the right tool, and _xact_
      // specifically because the pooler shares backends between sessions.
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext(${invite.orgId}))`
      );

      await tx.insert(memberships).values({
        orgId: invite.orgId,
        userId: user.id,
        role: "member",
      });

      if (cap === null) return;

      const [row] = await tx
        .select({ n: count() })
        .from(memberships)
        .where(eq(memberships.orgId, invite.orgId));

      if (Number(row?.n ?? 0) > cap) {
        throw new Error("SEATS_FULL");
      }
    });
  } catch (e) {
    if (e instanceof Error && e.message === "SEATS_FULL") {
      return {
        error:
          "That team just filled its last seat. The owner can add one in Billing.",
      };
    }
    throw e;
  }

  // The manager's board and header list members; a new teammate should
  // appear on their next load, not their next deploy.
  revalidatePath("/pipeline");
  revalidatePath("/", "layout");

  redirect("/pipeline");
}
