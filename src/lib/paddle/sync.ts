import { eq } from "drizzle-orm";
import type { EventEntity } from "@paddle/paddle-node-sdk";
import { db } from "@/db";
import { organizations, subscriptions } from "@/db/schema";

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

      return `${event.eventType} -> ${sub.status}, ${values.quantity} seat(s)`;
    }

    default:
      return `ignored ${event.eventType}`;
  }
}
