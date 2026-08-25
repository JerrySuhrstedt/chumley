import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { memberships, organizations, subscriptions } from "@/db/schema";
import type { Subscription } from "@/db/schema";
import { TRIAL_DAYS } from "@/app/(marketing)/pricing/plans";

export type BillingState = {
  subscription: Subscription | null;
  /** May the team use the app right now? */
  active: boolean;
  /** Paid seats. Falls back to current headcount while nothing is billing. */
  seats: number;
  seatsUsed: number;
  seatsLeft: number;
  /** True when they can still read but not change anything. */
  readOnly: boolean;
  /** Set when a cancel or pause is pending but has not taken effect. */
  endingAt: Date | null;
  trialEndsAt: Date | null;
  /**
   * True when the access they have comes from the free trial rather than
   * from a subscription. The banner needs to tell those two apart: "your
   * trial ends Friday" and "your plan ends Friday" are different messages
   * to a person who has not paid us anything yet.
   */
  inTrial: boolean;
  /**
   * Comped by an administrator: full access, billed nothing, and not a
   * Paddle subscription. Outranks the trial and outranks a lapsed plan.
   */
  comped: boolean;
  /** When the comp runs out. Null while comped means indefinitely. */
  compedUntil: Date | null;
  /**
   * A negotiated price for this team, in cents per seat per month, and the
   * Paddle price that charges it. Null on both means list pricing.
   */
  customPriceCents: number | null;
  customPriceId: string | null;
  /** No payment provider configured at all, so nothing is being charged. */
  billingLive: boolean;
};

/**
 * Statuses that keep the lights on.
 *
 * past_due is deliberately included. Paddle retries a failed card for days,
 * and locking a salesperson out of their own pipeline over a card that
 * expired on Tuesday costs more goodwill than the few days of service is
 * worth. They get a banner instead.
 */
const ALLOWED = new Set(["active", "trialing", "past_due"]);

export async function getBillingState(orgId: string): Promise<BillingState> {
  const billingLive = Boolean(process.env.PADDLE_API_KEY);

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.orgId, orgId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  const [used] = await db
    .select({ n: count() })
    .from(memberships)
    .where(eq(memberships.orgId, orgId));

  const seatsUsed = Number(used?.n ?? 0);

  const [org] = await db
    .select({
      createdAt: organizations.createdAt,
      compedAt: organizations.compedAt,
      compedUntil: organizations.compedUntil,
      customPriceCents: organizations.customPriceCents,
      customPriceId: organizations.customPriceId,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  // Until billing is switched on, nothing is gated and nothing is capped.
  // A half-built paywall that locks people out of a free product is the
  // worst of both. This is the self-hosted and local-development case.
  if (!billingLive) {
    return {
      subscription: null,
      active: true,
      seats: seatsUsed,
      seatsUsed,
      seatsLeft: Number.POSITIVE_INFINITY,
      readOnly: false,
      endingAt: null,
      trialEndsAt: null,
      inTrial: false,
      comped: false,
      compedUntil: null,
      customPriceCents: org?.customPriceCents ?? null,
      customPriceId: org?.customPriceId ?? null,
      billingLive,
    };
  }

  /**
   * A comp beats everything below it.
   *
   * Checked before the subscription and before the trial, because those
   * are both answers to "have they paid" and a comp is the decision that
   * they do not have to. A comped team whose card expired, or whose trial
   * ran out months ago, still works.
   */
  const compExpired =
    org?.compedUntil != null && Date.now() >= org.compedUntil.getTime();

  if (org?.compedAt && !compExpired) {
    return {
      // Kept, so the admin screen and the billing page can still show what
      // they were on before the comp rather than pretending it never was.
      subscription: sub ?? null,
      active: true,
      seats: seatsUsed,
      seatsUsed,
      seatsLeft: Number.POSITIVE_INFINITY,
      readOnly: false,
      endingAt: null,
      trialEndsAt: null,
      inTrial: false,
      comped: true,
      compedUntil: org.compedUntil ?? null,
      customPriceCents: org.customPriceCents ?? null,
      customPriceId: org.customPriceId ?? null,
      billingLive,
    };
  }

  /**
   * Billing is on and they have never subscribed, so they are on the free
   * trial, and the trial has to actually end.
   *
   * It runs from the day the team was created, not from any Paddle record,
   * because the whole point of the offer is that no card is needed to start
   * one. Before this existed the same branch returned unlimited access
   * forever, which meant the pricing page promised fourteen days and the
   * code gave away the product.
   */
  if (!sub) {
    const started = org?.createdAt ?? new Date();
    const trialEndsAt = new Date(
      started.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000
    );
    const inTrial = Date.now() < trialEndsAt.getTime();

    return {
      subscription: null,
      active: inTrial,
      seats: seatsUsed,
      seatsUsed,
      // The trial is the whole product, seats included. Capping it would
      // stop a manager evaluating it with the team who would actually use
      // it, which is the only evaluation that answers anything.
      seatsLeft: inTrial ? Number.POSITIVE_INFINITY : 0,
      readOnly: !inTrial,
      endingAt: null,
      // Kept once expired too, so the banner can say when it ran out
      // rather than just that it did.
      trialEndsAt,
      inTrial,
      comped: false,
      compedUntil: null,
      customPriceCents: org?.customPriceCents ?? null,
      customPriceId: org?.customPriceId ?? null,
      billingLive,
    };
  }

  const active = ALLOWED.has(sub.status);

  return {
    subscription: sub,
    active,
    seats: sub.quantity,
    seatsUsed,
    seatsLeft: Math.max(0, sub.quantity - seatsUsed),
    // Lapsed teams keep their data and can still read it. Holding somebody's
    // own contacts hostage is not a business model.
    readOnly: !active,
    endingAt: sub.scheduledChangeAt,
    trialEndsAt: sub.trialEndsAt,
    inTrial: sub.status === "trialing",
    comped: false,
    compedUntil: null,
    customPriceCents: org?.customPriceCents ?? null,
    customPriceId: org?.customPriceId ?? null,
    billingLive,
  };
}

/** Whether one more person can be added to this team right now. */
export async function canAddSeat(orgId: string): Promise<boolean> {
  const state = await getBillingState(orgId);
  return state.seatsLeft > 0;
}

/** Members of a team, for the seat counter. */
export async function countMembers(orgId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(memberships)
    .where(and(eq(memberships.orgId, orgId)));
  return Number(row?.n ?? 0);
}
