import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { memberships, subscriptions } from "@/db/schema";
import type { Subscription } from "@/db/schema";

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

  // Until billing is switched on, nothing is gated and nothing is capped.
  // A half-built paywall that locks people out of a free product is the
  // worst of both.
  if (!billingLive || !sub) {
    return {
      subscription: sub ?? null,
      active: true,
      seats: seatsUsed,
      seatsUsed,
      seatsLeft: Number.POSITIVE_INFINITY,
      readOnly: false,
      endingAt: null,
      trialEndsAt: null,
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
