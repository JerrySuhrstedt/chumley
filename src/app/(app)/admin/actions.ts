"use server";

import { revalidatePath } from "next/cache";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { organizations, subscriptions } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { getCurrentOrg, getCurrentUser } from "@/lib/org";
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


/* ------------------------------------------------------------------ comps */

/**
 * Free accounts, granted by hand.
 *
 * A comp is a flag on the team, not a Paddle object. There is no zero-priced
 * plan, no 100% discount and no fabricated subscription row, because all
 * three would put our decision inside a system whose webhooks could later
 * take it back: a cancellation, a failed payment or a plan change would end
 * a gift that had nothing to do with any of them.
 *
 * Billing is left alone here on purpose, the same way switching an account
 * off leaves it alone. Giving somebody the product and stopping their card
 * being charged are two decisions, and an admin who wants both should make
 * both, so that neither happens by side effect. Where a team is genuinely
 * still being billed, the result below says so rather than leaving it to be
 * discovered on a statement.
 */

/** Days a comp can run for. Null is indefinite. */
export type CompLength = number | null;

export async function adminGrantComp(
  orgId: string,
  reason: string,
  days: CompLength
): Promise<AdminActionResult> {
  await requireAdmin();

  const trimmed = reason.trim();
  if (trimmed.length < 3) {
    // Not bureaucracy. An unexplained free account is unreadable to whoever
    // finds it later, and that is usually the person who granted it.
    return { error: "Say why. Whoever reads this later will need it." };
  }
  if (days !== null && (!Number.isInteger(days) || days < 1 || days > 3650)) {
    return { error: "Length must be a whole number of days, up to ten years." };
  }

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  if (!org) return { error: "That team is gone." };

  const admin = await getCurrentUser();

  await db
    .update(organizations)
    .set({
      compedAt: new Date(),
      compedUntil:
        days === null ? null : new Date(Date.now() + days * 86_400_000),
      compedReason: trimmed,
      compedBy: admin?.id ?? null,
    })
    .where(eq(organizations.id, orgId));

  // Every page reads billing state through the layout.
  revalidatePath("/", "layout");

  // Whether their card is still going to be charged, said out loud.
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.orgId, orgId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  const stillBilling =
    sub && !["canceled", "paused"].includes(sub.status)
      ? ` They are still on a paid plan, so Paddle will keep charging them. Cancel their plan as well if that is not what you want.`
      : "";

  const span =
    days === null ? "indefinitely" : `for ${days} day${days === 1 ? "" : "s"}`;

  return {
    error: null,
    message: `"${org.name}" is free ${span}.${stillBilling}`,
  };
}

/**
 * Take a comp back.
 *
 * What happens next is whatever their real situation was all along: a live
 * subscription resumes deciding, and a team with neither subscription nor
 * trial left goes read-only. Nothing is deleted either way.
 */
export async function adminRevokeComp(
  orgId: string
): Promise<AdminActionResult> {
  await requireAdmin();

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  if (!org) return { error: "That team is gone." };
  if (!org.compedAt) return { error: "That team is not on a free account." };

  await db
    .update(organizations)
    .set({
      compedAt: null,
      compedUntil: null,
      compedReason: null,
      compedBy: null,
    })
    .where(eq(organizations.id, orgId));

  revalidatePath("/", "layout");
  return {
    error: null,
    message: `"${org.name}" is back on normal billing. Nothing was deleted.`,
  };
}

/**
 * Pick a team at random, for a giveaway.
 *
 * Chooses, and stops. The comp itself still goes through adminGrantComp
 * with a reason attached, because a button that both picks and gives has
 * no moment in it where a human can decide not to.
 *
 * Teams already comped or switched off are excluded: the first because
 * gifting a free account to somebody who has one is not a gift, the second
 * because they cannot use it.
 */
export async function adminPickRandomForComp(): Promise<{
  error: string | null;
  pick: { orgId: string; name: string; ownerEmail: string | null } | null;
}> {
  await requireAdmin();

  const rows = (await db.execute(sql`
    SELECT o.id, o.name,
           (SELECT u.email FROM memberships m
              JOIN auth.users u ON u.id = m.user_id
             WHERE m.org_id = o.id AND m.role = 'owner'
             ORDER BY m.created_at LIMIT 1) AS owner_email
    FROM organizations o
    WHERE o.comped_at IS NULL
      AND o.deactivated_at IS NULL
    ORDER BY random()
    LIMIT 1
  `)) as unknown as Record<string, unknown>[];

  const row = rows[0];
  if (!row) {
    return { error: "Nobody is eligible. Everyone is already comped or off.", pick: null };
  }

  return {
    error: null,
    pick: {
      orgId: String(row.id),
      name: String(row.name),
      ownerEmail: (row.owner_email as string) ?? null,
    },
  };
}
