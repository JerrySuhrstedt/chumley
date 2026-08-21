"use server";

import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { memberships, orgInvites } from "@/db/schema";
import { getCurrentUser } from "@/lib/org";
import { seatCheck } from "@/lib/gate";

export async function joinOrg(token: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You need to be signed in." as const };
  }

  const invite = await db.query.orgInvites.findFirst({
    where: eq(orgInvites.token, token),
  });

  if (!invite) {
    return { error: "This invite link is invalid." as const };
  }

  const existing = await db.query.memberships.findFirst({
    where: eq(memberships.userId, user.id),
  });

  if (existing) {
    return {
      error:
        existing.orgId === invite.orgId
          ? null
          : ("You're already on a different team." as const),
    };
  }

  /**
   * The seat limit, enforced for the first time at the only moment that
   * counts.
   *
   * The Team page hides the invite link when a team is full, which is
   * where this stopped before. That is a suggestion, not a limit: the
   * link never expires and never rotates, so one copied while a seat was
   * free went on working for anyone it was forwarded to, and a team
   * paying for one seat could seat ten.
   */
  const seats = await seatCheck(invite.orgId);
  if (!seats.ok) return { error: seats.error };

  /**
   * Insert, then count, then undo if that put them over.
   *
   * Checking before inserting is two steps, and two people opening the
   * same link at the same moment both pass the check and both get in.
   * Counting after the write is inside the transaction settles it: the
   * loser rolls back and is told the team is full.
   */
  const { cap } = seats;
  try {
    await db.transaction(async (tx) => {
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
          "That team just filled its last seat. The owner can add one in Billing." as const,
      };
    }
    throw e;
  }

  return { error: null };
}
