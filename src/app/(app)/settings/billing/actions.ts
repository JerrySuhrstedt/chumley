"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { getCurrentOrg } from "@/lib/org";
import { paddle } from "@/lib/paddle/server";
import { priceFor } from "@/lib/paddle/catalog";
import { countMembers } from "@/lib/paddle/access";
import { TEAM_MIN } from "@/app/(marketing)/pricing/plans";

/**
 * Changing the number of seats.
 *
 * Crossing three, five or ten does not just change the quantity, it
 * changes which price is being billed, because the volume ladder is a
 * separate Paddle price per break. So every change sends both, and the
 * arithmetic stays in priceFor where the pricing page can already see it.
 */

/** Seats a team is allowed to ask for: never fewer than people already in it. */
function clamp(want: number, members: number) {
  const floor = Math.max(1, members);
  const n = Math.max(floor, Math.min(200, Math.round(want)));
  // There is no team price for two, so two is not a number anyone can buy.
  if (n > 1 && n < TEAM_MIN) return TEAM_MIN;
  return n;
}

async function load() {
  const current = await getCurrentOrg();
  if (!current) return { error: "No organization." as const };
  if (current.role !== "owner") {
    return { error: "Only the team owner can change the plan." as const };
  }

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.orgId, current.org.id))
    .limit(1);

  if (!sub) return { error: "There is no subscription to change." as const };
  return { current, sub, error: null };
}

/**
 * What it would cost, before anything is charged.
 *
 * A stepper that quietly bills a card the moment it is tapped is exactly
 * the behaviour this product's buyers say they have been burned by, so
 * they see the number first and press a second button to accept it.
 */
export async function previewSeats(want: number) {
  const loaded = await load();
  if (loaded.error) return { error: loaded.error, quote: null };
  const { current, sub } = loaded;

  const members = await countMembers(current.org.id);
  const seats = clamp(want, members);
  const plan = await planFor(sub, seats);

  try {
    const preview = await paddle().subscriptions.previewUpdate(sub.id, {
      items: [{ priceId: plan.priceId, quantity: seats }],
      prorationBillingMode: plan.proration,
    });

    const result = preview.immediateTransaction?.details?.totals;
    const next = preview.recurringTransactionDetails?.totals;

    return {
      error: null,
      quote: {
        seats,
        // True when Paddle is quoting the single-seat rate because the
        // trial forbids moving to the team price yet. The quote is real,
        // it is simply the higher of the two, and correcting it is the
        // job of tierCorrection below.
        beforeTeamRate: plan.deferred,
        // What leaves the card today. Zero during a trial, which is the
        // common case here and worth showing rather than hiding.
        dueNow: result?.grandTotal ?? "0",
        // What the bill becomes from the next renewal onward.
        recurring: next?.total ?? null,
        currency: result?.currencyCode ?? next?.currencyCode ?? "USD",
      },
    };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Could not price that change.",
      quote: null,
    };
  }
}


/**
 * What Paddle will actually accept for this subscription.
 *
 * Paddle forbids swapping the price on a trialing subscription, and
 * insists quantity changes on one bill nothing. So a solo trialer who
 * adds two teammates stays on the single-seat price and is quoted three
 * times $19 rather than three times $15.
 *
 * That quote is honest, just unflattering, and it is the safe direction
 * to be wrong in: they are told the higher number and later charged the
 * lower one. tierCorrection in sync.ts drops them onto the team price the
 * moment the trial ends and Paddle allows it.
 */
async function planFor(
  sub: { status: string; priceId: string },
  seats: number
) {
  const trialing = sub.status === "trialing";
  const yearly = await isYearly(sub.priceId);
  const wanted = priceFor(seats, yearly);

  if (trialing) {
    return {
      priceId: sub.priceId,
      proration: "do_not_bill" as const,
      deferred: wanted !== sub.priceId,
    };
  }

  return {
    priceId: wanted,
    proration: "prorated_immediately" as const,
    deferred: false,
  };
}

/** Whether the current price is one of the yearly ones. */
async function isYearly(priceId: string) {
  const { PRICES } = await import("@/lib/paddle/catalog");
  const yearlyIds = [
    PRICES.solo.yearly,
    PRICES.team["3to4"].yearly,
    PRICES.team["5to9"].yearly,
    PRICES.team["10plus"].yearly,
  ];
  return yearlyIds.includes(priceId as (typeof yearlyIds)[number]);
}

export async function changeSeats(want: number) {
  const loaded = await load();
  if (loaded.error) return { error: loaded.error };
  const { current, sub } = loaded;

  const members = await countMembers(current.org.id);
  const seats = clamp(want, members);

  if (seats === sub.quantity) return { error: null };

  const plan = await planFor(sub, seats);

  try {
    await paddle().subscriptions.update(sub.id, {
      items: [{ priceId: plan.priceId, quantity: seats }],
      prorationBillingMode: plan.proration,
    });
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Paddle refused that change.",
    };
  }

  // Paddle sends subscription.updated straight after, and the webhook is
  // the thing that writes the row. Writing it here as well would mean two
  // sources of truth disagreeing the moment one of them fails, so this
  // waits for the webhook and only refreshes the page.
  revalidatePath("/settings/billing");
  revalidatePath("/settings/team");
  return { error: null };
}
