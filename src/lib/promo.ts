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

  /**
   * Count, redeem, and grant in one locked transaction.
   *
   * The redemption row and the comp grant have to move together: a crash
   * between them used to consume the team's one redemption while granting
   * zero free days. And a plain count-then-insert lets two teams redeeming
   * the last slot both pass the cap, since neither sees the other's
   * uncommitted row. Locking the code row first serializes redeemers of
   * this code, so the count is taken against a settled set and the loser
   * is turned away with nothing consumed.
   */
  try {
    const until = await db.transaction(async (tx) => {
      if (promo.maxRedemptions !== null) {
        await tx.execute(
          dsql`SELECT 1 FROM promo_codes WHERE id = ${promo.id}::uuid FOR UPDATE`
        );
        const [{ n }] = (await tx.execute(dsql`
          SELECT count(*)::int AS n FROM promo_redemptions
          WHERE code_id = ${promo.id}::uuid
        `)) as unknown as { n: number }[];
        if (Number(n) >= promo.maxRedemptions) {
          throw new Error("EXHAUSTED");
        }
      }

      // The unique index still referees a team redeeming twice.
      await tx.insert(promoRedemptions).values({ codeId: promo.id, orgId });

      const [org] = await tx
        .select({
          compedAt: organizations.compedAt,
          compedUntil: organizations.compedUntil,
        })
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1);
      if (!org) throw new Error("NO_ORG");

      const base =
        org.compedUntil && org.compedUntil.getTime() > Date.now()
          ? org.compedUntil
          : new Date();
      const granted = new Date(base.getTime() + promo.value * 86_400_000);

      await tx
        .update(organizations)
        .set({
          compedAt: org.compedAt ?? new Date(),
          compedUntil: granted,
          compedReason: `Promo ${promo.code}`,
        })
        .where(eq(organizations.id, orgId));

      return granted;
    });

    return {
      error: null,
      message: `${promo.value} free days added. You're covered until ${until.toLocaleDateString(
        undefined,
        { month: "long", day: "numeric" }
      )}.`,
    };
  } catch (e) {
    if (e instanceof Error && e.message === "EXHAUSTED") {
      return { error: "That code has been fully redeemed." };
    }
    if (e instanceof Error && e.message === "NO_ORG") {
      return { error: "Team not found." };
    }
    // Unique index: this team has already redeemed this code.
    if (
      e &&
      typeof e === "object" &&
      "code" in e &&
      (e as { code?: string }).code === "23505"
    ) {
      return { error: "Your team has already used this code." };
    }
    throw e;
  }
}
