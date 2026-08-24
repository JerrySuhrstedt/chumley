"use server";

import { revalidatePath } from "next/cache";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { organizations, subscriptions } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { getCurrentOrg } from "@/lib/org";
import { paddle, isBillingConfigured } from "@/lib/paddle/server";

/**
 * Back-office controls that end an account.
 *
 * Both gate on requireAdmin first, before a single row is read. Deleting
 * also demands the team's name typed back, which is not security, it is
 * friction: the mistake this prevents is the one where the wrong row was
 * clicked, and only a human can catch that.
 */

export type AdminActionResult = { error: string | null; message?: string };

/** Cancel a team's plan at the end of the period they have paid for. */
export async function adminCancelSubscription(
  orgId: string
): Promise<AdminActionResult> {
  await requireAdmin();

  // Newest first. A team with a cancelled row and a live one must not have
  // the cancelled one acted on.
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.orgId, orgId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  if (!sub) return { error: "That team has no subscription." };
  if (sub.scheduledChangeAction === "cancel") {
    return { error: null, message: "Already scheduled to cancel." };
  }
  if (!isBillingConfigured()) {
    return { error: "Billing is not configured in this environment." };
  }

  try {
    const result = await paddle().subscriptions.cancel(sub.id, {
      effectiveFrom: "next_billing_period",
    });
    revalidatePath("/admin");
    return {
      error: null,
      message: result.scheduledChange?.effectiveAt
        ? `Ends ${new Date(result.scheduledChange.effectiveAt).toLocaleDateString()}.`
        : "Cancellation scheduled.",
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Paddle refused that." };
  }
}

/**
 * Delete a team and everyone in it.
 *
 * Order matters. Paddle is stopped first, because deleting the rows here
 * would leave a live subscription with no team to bill for and no way to
 * find it again. Then the organisation goes, and the database cascades
 * through leads, activities, memberships, invites, stages, subscriptions
 * and templates.
 *
 * Problem reports deliberately survive, with their team set to null. They
 * are evidence about the product, and the most useful ones come from
 * people on their way out.
 */
export async function adminDeleteAccount(
  orgId: string,
  typedName: string
): Promise<AdminActionResult> {
  await requireAdmin();

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) return { error: "That team is already gone." };

  if (typedName.trim() !== org.name) {
    return { error: `Type "${org.name}" exactly to confirm.` };
  }

  // Deleting the team you are signed in with would log you out of the
  // tool you are using to do it.
  const current = await getCurrentOrg();
  if (current?.org.id === orgId) {
    return { error: "That is your own team. Delete it from another account." };
  }

  // Stop the billing before removing the thing being billed for.
  //
  // Every subscription, not just one. Deleting the org cascades the rows
  // away, so a second subscription missed here becomes a live Paddle
  // subscription with nothing left in our database pointing at it, billing
  // a real customer every month with no way to find it.
  const subs = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.orgId, orgId))
    .orderBy(desc(subscriptions.createdAt));

  for (const sub of subs) {
    if (!isBillingConfigured() || sub.status === "canceled") continue;
    try {
      await paddle().subscriptions.cancel(sub.id, {
        effectiveFrom: "immediately",
      });
    } catch (e) {
      return {
        error: `Could not stop billing, so nothing was deleted: ${
          e instanceof Error ? e.message : "Paddle refused"
        }`,
      };
    }
  }

  // Who will have no team left afterwards. Read before the cascade takes
  // the memberships away.
  const orphaned = (await db.execute(sql`
    SELECT m.user_id
    FROM memberships m
    WHERE m.org_id = ${orgId}
      AND NOT EXISTS (
        SELECT 1 FROM memberships other
        WHERE other.user_id = m.user_id AND other.org_id <> ${orgId}
      )
  `)) as unknown as { user_id: string }[];

  await db.delete(organizations).where(eq(organizations.id, orgId));

  // Then the sign-ins themselves, so the address can be used again.
  let removed = 0;
  for (const row of orphaned) {
    try {
      await db.execute(
        sql`DELETE FROM auth.users WHERE id = ${row.user_id}::uuid`
      );
      removed += 1;
    } catch {
      // The team is already gone; a stranded login is untidy, not unsafe.
    }
  }

  revalidatePath("/admin");
  return {
    error: null,
    message: `"${org.name}" deleted, along with ${removed} sign-in${
      removed === 1 ? "" : "s"
    }.`,
  };
}

/**
 * Switch an account off, or back on, without touching their data.
 *
 * The step that was missing between cancelling a plan and deleting an
 * account. Billing is deliberately left alone: stopping access and
 * stopping the money are separate decisions, and someone suspended for
 * abuse should not also get a refund by side effect.
 */
export async function adminSetActive(
  orgId: string,
  active: boolean
): Promise<AdminActionResult> {
  await requireAdmin();

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  if (!org) return { error: "That team is gone." };

  const current = await getCurrentOrg();
  if (!active && current?.org.id === orgId) {
    return { error: "That is your own team. You would lock yourself out." };
  }

  await db
    .update(organizations)
    .set({ deactivatedAt: active ? null : new Date() })
    .where(eq(organizations.id, orgId));

  // The layout reads this on every request, so everything has to re-run.
  revalidatePath("/", "layout");
  return {
    error: null,
    message: active
      ? `"${org.name}" can sign in again.`
      : `"${org.name}" is switched off. Nothing was deleted.`,
  };
}
