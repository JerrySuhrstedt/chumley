"use server";

import { revalidatePath } from "next/cache";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { organizations, subscriptions } from "@/db/schema";
import { isAdminEmail, requireAdmin } from "@/lib/admin";
import { alert } from "@/lib/alert";
import { getCurrentOrg, getCurrentUser } from "@/lib/org";
import { paddle, isBillingConfigured } from "@/lib/paddle/server";
import {
  centsToDollars,
  dollarsToCents,
  ensureCustomPrice,
} from "@/lib/paddle/custom-price";

/**
 * Back-office controls that end an account.
 *
 * Both gate on requireAdmin first, before a single row is read. Deleting
 * also demands the team's name typed back, which is not security, it is
 * friction: the mistake this prevents is the one where the wrong row was
 * clicked, and only a human can catch that.
 */

export type AdminActionResult = { error: string | null; message?: string };

/**
 * Whether a Paddle error means "there is nothing here to cancel".
 *
 * A subscription Paddle has never heard of is not a failure to stop
 * billing, it is proof that nothing is being billed, and treating it as an
 * error blocks perfectly reasonable admin work. This is not hypothetical:
 * migrating from sandbox to live leaves mirror rows behind that reference
 * sandbox ids, and every one of them looks exactly like this.
 */
function isMissingInPaddle(e: unknown): boolean {
  const code = (e as { code?: string } | null)?.code ?? "";
  const message = e instanceof Error ? e.message : String(e ?? "");
  return (
    code === "entity_not_found" ||
    code === "not_found" ||
    /not found/i.test(message)
  );
}



/**
 * The owner's email when the team belongs to a listed administrator.
 *
 * The back office must not be able to destroy the account its own
 * operator depends on. Null for every ordinary team.
 */
async function adminOwnerOf(orgId: string): Promise<string | null> {
  const rows = (await db.execute(sql`
    SELECT u.email FROM memberships m
    JOIN auth.users u ON u.id = m.user_id
    WHERE m.org_id = ${orgId} AND m.role = 'owner'
    ORDER BY m.created_at
  `)) as unknown as { email: string | null }[];
  const hit = rows.find((r) => isAdminEmail(r.email));
  return hit?.email ?? null;
}

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
    if (isMissingInPaddle(e)) {
      // A row we mirror but Paddle does not have. Nobody is being charged;
      // correct our copy and say so plainly rather than showing a raw
      // "not found" that reads like the app is broken.
      await db
        .update(subscriptions)
        .set({ status: "canceled", updatedAt: new Date() })
        .where(eq(subscriptions.id, sub.id));
      revalidatePath("/admin");
      revalidatePath("/", "layout");
      return {
        error: null,
        message:
          "Paddle has no record of that plan, so there was nothing to cancel. Marked it cancelled here.",
      };
    }
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

  // An administrator's own team is off limits, from any account. The way
  // to delete it is to remove the owner from ADMIN_EMAILS first, which
  // makes the decision explicit instead of one misclick deep.
  const adminOwner = await adminOwnerOf(orgId);
  if (adminOwner) {
    return {
      error: `"${org.name}" belongs to administrator ${adminOwner}. Remove them from ADMIN_EMAILS first if you really mean it.`,
    };
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
  //
  // next_billing_period, never immediately, and that is a deliberate policy
  // rather than an oversight. Immediate cancellation has Paddle refund the
  // unused part of the period, so an admin deleting an account would be
  // issuing refunds as a side effect of a button that says nothing about
  // money. Ending at the period boundary stops every future charge, which
  // is the part that matters, and leaves the already-paid period alone.
  //
  // The scheduled cancellation outlives our record of it. Our row goes with
  // the org moments later, but Paddle holds the schedule and honours it, and
  // Paddle is the system of record for billing regardless of what we keep.
  const subs = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.orgId, orgId))
    .orderBy(desc(subscriptions.createdAt));

  for (const sub of subs) {
    if (!isBillingConfigured() || sub.status === "canceled") continue;
    try {
      await paddle().subscriptions.cancel(sub.id, {
        effectiveFrom: "next_billing_period",
      });
    } catch (e) {
      // A subscription Paddle cannot find is already not billing anybody,
      // so it is not a reason to refuse the delete.
      if (!isMissingInPaddle(e)) {
        return {
          error: `Could not stop billing, so nothing was deleted: ${
            e instanceof Error ? e.message : "Paddle refused"
          }`,
        };
      }
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

  if (!active) {
    const adminOwner = await adminOwnerOf(orgId);
    if (adminOwner) {
      return {
        error: `"${org.name}" belongs to administrator ${adminOwner} and stays on.`,
      };
    }
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
 * Granting a comp cancels any live Paddle plan as part of the same action,
 * because "give them a free account" and "keep charging their card" cannot
 * both be true. This is the one place that deliberately couples access and
 * billing, unlike switching an account off, where the two really are
 * separate decisions: suspending somebody for abuse should not hand them a
 * refund by side effect, whereas comping somebody and still billing them is
 * simply a bug with a friendly label on it.
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

  /**
   * Stop the money before giving the product away, in that order.
   *
   * The order is the whole point. Grant first and a Paddle failure leaves a
   * team with free access and a live subscription still charging them every
   * month, which is the worst of the possible outcomes and the one nobody
   * would notice: the app would look right to them and to us. Cancelling
   * first means the bad case is that nothing happens and this returns an
   * error, which an admin can see and retry.
   *
   * next_billing_period rather than immediately. Both stop the next charge,
   * which is the actual ask. Immediate cancellation can have Paddle issue a
   * prorated refund, and an admin clicking "make it free" has not asked for
   * money to move. They lose no access by waiting either way, because the
   * comp covers them from this moment regardless.
   */
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.orgId, orgId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  const live =
    sub && !["canceled", "paused"].includes(sub.status) ? sub : null;

  let billingNote = "";

  if (live && isBillingConfigured()) {
    if (live.scheduledChangeAction === "cancel") {
      billingNote = " Their plan was already set to end, so nothing was charged again anyway.";
    } else {
      try {
        await paddle().subscriptions.cancel(live.id, {
          effectiveFrom: "next_billing_period",
        });
        billingNote = " Their paid plan is cancelled, so nothing will be charged again.";
      } catch (e) {
        if (isMissingInPaddle(e)) {
          // Nothing to stop. Record that, rather than blocking on it.
          await db
            .update(subscriptions)
            .set({ status: "canceled", updatedAt: new Date() })
            .where(eq(subscriptions.id, live.id));
          billingNote =
            " Paddle has no record of their plan, so there was nothing to cancel.";
        } else {
          return {
            error: `Could not cancel their Paddle plan, so nothing was changed: ${
              e instanceof Error ? e.message : "Paddle refused"
            }`,
          };
        }
      }
    }
  } else if (live && !isBillingConfigured()) {
    // No API key, so we cannot honour the promise this action makes.
    return {
      error:
        "They are on a paid plan but billing is not configured here, so it cannot be cancelled. Nothing was changed.",
    };
  }

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

  const span =
    days === null ? "indefinitely" : `for ${days} day${days === 1 ? "" : "s"}`;

  return {
    error: null,
    message: `"${org.name}" is free ${span}.${billingNote}`,
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
    message: `"${org.name}" is off the free account. Any plan cancelled when they were comped stays cancelled, so they will need to subscribe again. Nothing was deleted.`,
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


/* --------------------------------------------------------- custom pricing */

/**
 * A negotiated price for one team.
 *
 * Separate from a comp, and deliberately so. A comp is "you pay nothing";
 * this is "you pay this instead", which keeps them a real paying customer
 * with a real invoice and real tax handling, and keeps the subscription
 * machinery, the seat counting and the webhooks all working exactly as
 * they do for everybody else. Setting it to zero is not supported: that is
 * what the comp is for, and two ways to express free would eventually
 * disagree with each other.
 *
 * Takes effect at the next checkout. Changing what an existing subscription
 * is billed is a separate decision with proration attached, so it is left
 * to the seat controls rather than done silently here.
 */
export async function adminSetCustomPrice(
  orgId: string,
  amount: string,
  reason: string
): Promise<AdminActionResult> {
  await requireAdmin();

  const cents = dollarsToCents(amount);
  if (cents === null) {
    return { error: "Give an amount like 2 or 2.50. Zero is a comp, not a price." };
  }
  if (cents > 100_000_00) {
    return { error: "That is over $100,000 a seat. Check the number." };
  }

  const trimmed = reason.trim();
  if (trimmed.length < 3) {
    return { error: "Say why. Whoever finds this later will need it." };
  }

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  if (!org) return { error: "That team is gone." };

  if (!isBillingConfigured()) {
    return { error: "Billing is not configured here, so no price can be created." };
  }

  // Paddle first. If it will not hold the price there is nothing to record,
  // and a number in our database that Paddle cannot charge against is worse
  // than no number at all: checkout would fail at the moment of payment.
  let priceId: string;
  try {
    priceId = await ensureCustomPrice(cents);
  } catch (e) {
    return {
      error: `Could not create that price in Paddle, so nothing was changed: ${
        e instanceof Error ? e.message : "Paddle refused"
      }`,
    };
  }

  const admin = await getCurrentUser();

  await db
    .update(organizations)
    .set({
      customPriceCents: cents,
      customPriceId: priceId,
      customPriceReason: trimmed,
      customPriceBy: admin?.id ?? null,
      customPriceAt: new Date(),
    })
    .where(eq(organizations.id, orgId));

  revalidatePath("/", "layout");

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.orgId, orgId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  const already =
    sub && !["canceled", "paused"].includes(sub.status)
      ? " They are already subscribed, so this applies when they next subscribe, not to the plan they are on."
      : "";

  return {
    error: null,
    message: `"${org.name}" pays ${centsToDollars(cents)} per seat a month.${already}`,
  };
}

/** Back to the published ladder. Any live subscription keeps its own price. */
export async function adminClearCustomPrice(
  orgId: string
): Promise<AdminActionResult> {
  await requireAdmin();

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  if (!org) return { error: "That team is gone." };
  if (org.customPriceCents === null) {
    return { error: "That team is already on normal pricing." };
  }

  await db
    .update(organizations)
    .set({
      customPriceCents: null,
      customPriceId: null,
      customPriceReason: null,
      customPriceBy: null,
      customPriceAt: null,
    })
    .where(eq(organizations.id, orgId));

  revalidatePath("/", "layout");
  return {
    error: null,
    message: `"${org.name}" is back on list pricing. Anything they are already subscribed to is unchanged.`,
  };
}

/* -------------------------------------------------------------- alerting */

/**
 * Prove the alert path works, before it is needed.
 *
 * Alerting that has never been exercised is a guess. The failure it guards
 * against happens rarely and at bad times, which is exactly when nobody
 * wants to be discovering that the API key was wrong or the sender domain
 * was never verified.
 *
 * Bypasses the throttle deliberately, because a test that silently does
 * nothing because you pressed it twice teaches the wrong lesson.
 */
export async function adminSendTestAlert(): Promise<AdminActionResult> {
  await requireAdmin();

  if (!process.env.RESEND_API_KEY) {
    return {
      error:
        "RESEND_API_KEY is not set on this deployment, so nothing can be sent.",
    };
  }

  const admin = await getCurrentUser();

  await db.execute(
    sql`DELETE FROM alert_log WHERE key = 'manual-test'`
  );

  await alert(
    "manual-test",
    "Chumley: test alert",
    [
      "This is a test, sent from the back office.",
      "",
      `Requested by: ${admin?.email ?? "unknown"}`,
      "",
      "If this arrived, alerts about failing Paddle webhooks and about",
      "payments that cannot be matched to a team will arrive the same way.",
    ].join("\n")
  );

  return {
    error: null,
    message: "Sent. Check info@sumolab.co, including the spam folder.",
  };
}
