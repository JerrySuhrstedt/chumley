import { eq } from "drizzle-orm";
import type { EventEntity } from "@paddle/paddle-node-sdk";
import { db } from "@/db";
import { organizations, subscriptions } from "@/db/schema";
import { priceFor } from "@/lib/paddle/catalog";
import { paddle } from "@/lib/paddle/server";
import { PRICES } from "@/lib/paddle/catalog";

const date = (v: string | null | undefined) => (v ? new Date(v) : null);

/**
 * Which team a Paddle event belongs to.
 *
 * The checkout carries the team id in custom_data, which is the only
 * reliable bridge here. Matching on email would be wrong: the person
 * paying is often a manager whose address has nothing to do with the team
 * record, and one person can own more than one team.
 */
function orgIdFrom(data: unknown): string | null {
  const custom = (data as { customData?: Record<string, unknown> } | null)
    ?.customData;
  const value = custom?.orgId ?? custom?.org_id;
  return typeof value === "string" && value.length > 0 ? value : null;
}


const YEARLY_IDS: string[] = [
  PRICES.solo.yearly,
  PRICES.team["3to4"].yearly,
  PRICES.team["5to9"].yearly,
  PRICES.team["10plus"].yearly,
];

/**
 * Put a subscription onto the price its seat count has earned.
 *
 * Paddle will not let the price change while a subscription is trialing,
 * so a team that grew during their trial sits on the single-seat price
 * with the wrong number of seats attached. This is the first moment that
 * can be fixed, and it only ever moves the bill down.
 *
 * It is deliberately driven off state rather than off a particular event.
 * Any subscription webhook re-checks it, so a correction that failed once
 * is retried on the next one instead of being lost.
 */
async function correctTier(
  subId: string,
  status: string,
  priceId: string,
  quantity: number
): Promise<string> {
  if (status !== "active") return "";
  const wanted = priceFor(quantity, YEARLY_IDS.includes(priceId));
  if (wanted === priceId) return "";

  try {
    await paddle().subscriptions.update(subId, {
      items: [{ priceId: wanted, quantity }],
      prorationBillingMode: "prorated_immediately",
    });
    return ` (moved onto the ${quantity}-seat price)`;
  } catch (error) {
    // Not fatal. The customer is on the price they were quoted, which is
    // the higher one, and the next webhook tries again.
    console.error("tier correction failed", subId, error);
    return " (tier correction failed, will retry)";
  }
}

/**
 * Mirror one event into our own tables.
 *
 * Every write is an upsert keyed on Paddle's id, so a redelivered event
 * converges on the same row rather than creating a second, and an update
 * that somehow arrives before its create still lands. Paddle does not
 * promise ordering; convergent state is the answer, not sequencing.
 */
export async function syncPaddleEvent(event: EventEntity): Promise<string> {
  switch (event.eventType) {
    case "subscription.created":
    case "subscription.updated":
    case "subscription.activated":
    case "subscription.canceled":
    case "subscription.paused":
    case "subscription.resumed":
    case "subscription.trialing": {
      const sub = event.data as unknown as {
        id: string;
        customerId: string;
        status: string;
        items?: {
          price?: { id?: string; productId?: string };
          quantity?: number;
        }[];
        scheduledChange?: { action?: string; effectiveAt?: string } | null;
        currentBillingPeriod?: { endsAt?: string } | null;
        customData?: Record<string, unknown> | null;
      };

      const orgId = orgIdFrom(sub);
      if (!orgId) {
        // Nothing to attach it to. Better a loud gap in the log than a
        // subscription silently mirrored against the wrong team.
        return `skipped ${event.eventType}: no orgId in custom_data`;
      }

      const item = sub.items?.[0];
      const values = {
        id: sub.id,
        orgId,
        customerId: sub.customerId,
        status: sub.status,
        priceId: item?.price?.id ?? "",
        productId: item?.price?.productId ?? null,
        // Seats. This is what the invite flow measures against.
        quantity: item?.quantity ?? 1,
        scheduledChangeAt: date(sub.scheduledChange?.effectiveAt),
        scheduledChangeAction: sub.scheduledChange?.action ?? null,
        currentPeriodEnd: date(sub.currentBillingPeriod?.endsAt),
        trialEndsAt:
          sub.status === "trialing"
            ? date(sub.currentBillingPeriod?.endsAt)
            : null,
        updatedAt: new Date(),
      };

      await db
        .insert(subscriptions)
        .values(values)
        .onConflictDoUpdate({ target: subscriptions.id, set: values });

      // Remember the customer so a team that cancels and comes back bills
      // as the same one rather than a duplicate.
      await db
        .update(organizations)
        .set({ paddleCustomerId: sub.customerId })
        .where(eq(organizations.id, orgId));

      const fixed = await correctTier(
        sub.id,
        values.status,
        values.priceId,
        values.quantity
      );

      return `${event.eventType} -> ${sub.status}, ${values.quantity} seat(s)${fixed}`;
    }

    default:
      return `ignored ${event.eventType}`;
  }
}
