import "server-only";
import { and, eq, isNull, sql as dsql } from "drizzle-orm";
import { db } from "@/db";
import { organizations, promoCodes, promoRedemptions, subscriptions } from "@/db/schema";

export type RedeemResult = { error: string | null; message?: string };

/**
 * Redeem a free-time promo code for a team.
 *
 * Only free-time codes redeem here; money codes belong to Paddle's
 * checkout, and typing one into this box gets a pointer there instead
 * of an error. The free time lands as a comp: compedUntil moves out by
 * the code's days from now or from the current comp's end, whichever is
 * later, so stacking a second code extends rather than resets.
 *
 * Refused for teams with a live subscription: "free time" and "keep
 * charging their card" cannot both be true, and silently discounting a
 * paying team is a decision for a human, not a text box.
 */
export async function redeemFreeTimeCode(
  orgId: string,
  rawCode: string
): Promise<RedeemResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { error: "Enter a code." };

  const promo = await db.query.promoCodes.findFirst({
    where: and(eq(promoCodes.code, code), isNull(promoCodes.archivedAt)),
  });
  if (!promo) return { error: "That code is not valid." };
  if (promo.expiresAt && promo.expiresAt.getTime() < Date.now()) {
    return { error: "That code has expired." };
  }

  if (promo.kind !== "free_days") {
    return {
      error:
        "That code is a checkout discount. Enter it on the payment page when you pick a plan.",
    };
  }

  const [sub] = await db
    .select({ status: subscriptions.status })
    .from(subscriptions)
    .where(eq(subscriptions.orgId, orgId))
    .orderBy(dsql`created_at DESC`)
    .limit(1);
  if (sub && ["active", "trialing", "past_due"].includes(sub.status)) {
    return {
      error:
        "Your team already has a plan. Free-time codes only apply before you subscribe.",
    };
  }

  if (promo.maxRedemptions !== null) {
    const [{ n }] = (await db.execute(dsql`
      SELECT count(*)::int AS n FROM promo_redemptions
      WHERE code_id = ${promo.id}::uuid
    `)) as unknown as { n: number }[];
    if (Number(n) >= promo.maxRedemptions) {
      return { error: "That code has been fully redeemed." };
    }
  }

  // The unique index makes the double-redeem a database error rather
  // than a race, so insert first and let it referee.
  try {
    await db.insert(promoRedemptions).values({ codeId: promo.id, orgId });
  } catch {
    return { error: "Your team has already used this code." };
  }

  const [org] = await db
    .select({
      compedAt: organizations.compedAt,
      compedUntil: organizations.compedUntil,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  if (!org) return { error: "Team not found." };

  const base =
    org.compedUntil && org.compedUntil.getTime() > Date.now()
      ? org.compedUntil
      : new Date();
  const until = new Date(base.getTime() + promo.value * 86_400_000);

  await db
    .update(organizations)
    .set({
      compedAt: org.compedAt ?? new Date(),
      compedUntil: until,
      compedReason: `Promo ${promo.code}`,
    })
    .where(eq(organizations.id, orgId));

  return {
    error: null,
    message: `${promo.value} free days added. You're covered until ${until.toLocaleDateString(
      undefined,
      { month: "long", day: "numeric" }
    )}.`,
  };
}
