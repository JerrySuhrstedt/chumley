import { eq, sql as raw } from "drizzle-orm";
import type { EventEntity } from "@paddle/paddle-node-sdk";
import { db } from "@/db";
import { alertAsync } from "@/lib/alert";
import { organizations, subscriptions } from "@/db/schema";
import { priceFor } from "@/lib/paddle/catalog";
import { paddle } from "@/lib/paddle/server";

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

/**
 * The team behind a Paddle customer, when custom_data did not carry one.
 *
 * A second route to the same answer, for the case that costs the most: a
 * subscription event with no orgId is a person who has paid and cannot use
 * what they bought. We record paddleCustomerId on the first checkout, so a
 * returning customer can still be found even if the id we normally rely on
 * is missing from this particular payload.
 */
async function orgIdByCustomer(customerId: string): Promise<string | null> {
  if (!customerId) return null;
  const [org] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.paddleCustomerId, customerId))
    .limit(1);
  return org?.id ?? null;
}


/**
 * Put a subscription onto the one flat price.
 *
 * The volume ladder is gone (flat pricing, 08-27-2026), but Paddle will
 * not swap the price on a trialing subscription, so anything created on
 * a legacy price heals here the first webhook after its trial ends. A
 * negotiated custom price is a deal a human made and is never touched.
 */
async function correctTier(
  subId: string,
  status: string,
  priceId: string,
  quantity: number,
  customPriceId: string | null
): Promise<string> {
  if (status !== "active") return "";
  if (customPriceId && priceId === customPriceId) return "";
  const wanted = priceFor();
  if (wanted === priceId) return "";

  try {
    await paddle().subscriptions.update(subId, {
      items: [{ priceId: wanted, quantity }],
      prorationBillingMode: "prorated_immediately",
    });
    return " (moved onto the flat price)";
  } catch (error) {
    // Not fatal. The next webhook tries again.
    console.error("flat-price correction failed", subId, error);
    return " (price correction failed, will retry)";
  }
}

/**
 * Mirror one event into our own tables.
 *
 * Every write is an upsert keyed on Paddle's id, so a redelivered event
 * converges on the same row rather than creating a second, and an update
 * that somehow arrives before its create still lands.
 *
 * Idempotence alone is not enough, though, and an earlier version of this
 * comment claimed otherwise. Convergence only works when events commute,
 * and these do not: "cancelled" and "active" are the same field with
 * different answers, so whichever lands last wins regardless of which
 * actually happened last. Paddle retries failures, so a retried older
 * event really can arrive after a newer one and put a cancelled customer
 * back on active. Ordering is therefore enforced explicitly, on the
 * occurred_at Paddle stamps rather than on when we happened to receive it.
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
      const occurredAt = new Date(event.occurredAt);
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

      const orgId =
        orgIdFrom(sub) ?? (await orgIdByCustomer(sub.customerId));

      if (!orgId) {
        /**
         * A paid subscription with nowhere to put it.
         *
         * This used to return a string and a 200, which told Paddle the
         * event was handled and meant it was never retried or shown
         * anywhere. Somebody had paid, had no access, and the only trace
         * was a line in a response body nobody reads.
         *
         * Throwing turns it into a 500, which lands the event in Paddle's
         * own failed-deliveries list where it can be seen and replayed.
         * The retries are not wasted either: if the missing link is
         * repaired in between, a redelivery succeeds on its own.
         */
        console.error(
          "paddle webhook: subscription with no team",
          JSON.stringify({
            event: event.eventType,
            subscriptionId: sub.id,
            customerId: sub.customerId,
            occurredAt: event.occurredAt,
          })
        );
        // Its own key, because this one is not "something broke", it is
        // "somebody paid and cannot use what they bought", and it should
        // not be suppressed by an unrelated webhook failure holding the
        // shared throttle.
        alertAsync(
          "paddle-subscription-no-team",
          "Chumley: somebody paid and has no access",
          [
            `A ${event.eventType} arrived that cannot be matched to a team.`,
            "",
            `Subscription: ${sub.id}`,
            `Customer:     ${sub.customerId}`,
            `Occurred:     ${event.occurredAt}`,
            "",
            "They are being billed and have no access. Find the team in the",
            "back office, set its Paddle customer id to the one above, then",
            "replay the event from Notifications in the Paddle dashboard.",
          ].join("\n")
        );

        throw new Error(
          `No team for subscription ${sub.id} (customer ${sub.customerId}). Nothing was recorded.`
        );
      }

      // The opposite failure: the id resolves, the team is gone. An
      // administrator deleting an account cancels its subscription at
      // period end and removes the rows, but Paddle keeps narrating the
      // subscription's remaining life, and every episode used to hit the
      // organizations foreign key, 500, and retry for days. A deleted
      // tenant's billing epilogue is not an incident; acknowledge and drop.
      const [orgRow] = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1);
      if (!orgRow) {
        console.log(
          "paddle webhook: event for deleted team ignored",
          JSON.stringify({ event: event.eventType, subscriptionId: sub.id, orgId })
        );
        return `team ${orgId} was deleted; ${sub.id} not mirrored`;
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
        occurredAt,
        updatedAt: new Date(),
      };

      /**
       * Apply only if this event is newer than the one already recorded.
       *
       * The comparison lives in the WHERE of the upsert rather than in a
       * read followed by a write, so two deliveries arriving together
       * cannot both read the old row and both decide they are newest.
       * Postgres settles it.
       *
       * A row comes back when the write applied. No row means an older
       * event lost to a newer one, which is a correct outcome and not a
       * failure, so it must not be retried.
       */
      const applied = await db
        .insert(subscriptions)
        .values(values)
        .onConflictDoUpdate({
          target: subscriptions.id,
          set: values,
          // ISO string with an explicit cast, not the Date object. Inside a
          // raw fragment postgres-js gets the value with no type attached
          // and refuses a Date outright, which fails every webhook rather
          // than just this comparison.
          setWhere: raw`${subscriptions.occurredAt} IS NULL OR ${subscriptions.occurredAt} < ${occurredAt.toISOString()}::timestamptz`,
        })
        .returning({ id: subscriptions.id });

      if (applied.length === 0) {
        return `${event.eventType} ignored: an event newer than ${occurredAt.toISOString()} is already recorded`;
      }

      // Remember the customer so a team that cancels and comes back bills
      // as the same one rather than a duplicate.
      const [org] = await db
        .update(organizations)
        .set({ paddleCustomerId: sub.customerId })
        .where(eq(organizations.id, orgId))
        .returning({ customPriceId: organizations.customPriceId });

      const fixed = await correctTier(
        sub.id,
        values.status,
        values.priceId,
        values.quantity,
        org?.customPriceId ?? null
      );

      return `${event.eventType} -> ${sub.status}, ${values.quantity} seat(s)${fixed}`;
    }

    default:
      return `ignored ${event.eventType}`;
  }
}
