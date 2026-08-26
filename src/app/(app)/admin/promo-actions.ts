"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { promoCodes } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { paddle, isBillingConfigured } from "@/lib/paddle/server";
import type { AdminActionResult } from "./actions";

export type PromoKind = "percent" | "amount" | "free_days";

const CODE_RE = /^[A-Z0-9][A-Z0-9-]{2,29}$/;

/**
 * Create a promo code.
 *
 * Money codes are created inside Paddle first and mirrored here second,
 * in that order on purpose: a row with no Paddle discount behind it is a
 * code that fails at checkout in front of a customer, whereas a Paddle
 * discount with no row is invisible and harmless. Free-time codes exist
 * only here and never touch Paddle.
 */
export async function adminCreatePromoCode(input: {
  code: string;
  name: string;
  kind: PromoKind;
  /** Percent 1-100, whole dollars for amount, days for free_days. */
  value: number;
  maxRedemptions: number | null;
  /** ISO date, or null for no expiry. */
  expiresAt: string | null;
}): Promise<AdminActionResult> {
  await requireAdmin();

  const code = input.code.trim().toUpperCase();
  if (!CODE_RE.test(code)) {
    return {
      error:
        "Codes are 3-30 characters: letters, numbers and dashes, starting with a letter or number.",
    };
  }

  const name = input.name.trim().slice(0, 120);
  if (!name) return { error: "Give the campaign a name." };

  const value = Math.floor(input.value);
  if (input.kind === "percent" && (value < 1 || value > 100)) {
    return { error: "Percent must be between 1 and 100." };
  }
  if (input.kind === "amount" && (value < 1 || value > 10_000)) {
    return { error: "Amount must be between $1 and $10,000." };
  }
  if (input.kind === "free_days" && ![14, 30, 60].includes(value)) {
    return { error: "Free time is 14, 30 or 60 days." };
  }

  const existing = await db.query.promoCodes.findFirst({
    where: eq(promoCodes.code, code),
  });
  if (existing) return { error: `"${code}" already exists.` };

  const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    return { error: "That expiry date will not parse." };
  }

  let paddleDiscountId: string | null = null;
  if (input.kind !== "free_days") {
    if (!isBillingConfigured()) {
      return { error: "Paddle is not configured, so money codes cannot be created." };
    }
    try {
      const discount = await paddle().discounts.create({
        description: name,
        code,
        enabledForCheckout: true,
        // First payment only. A code that silently discounts forever is
        // a pricing decision, not a promotion.
        recur: false,
        ...(input.kind === "percent"
          ? { type: "percentage" as const, amount: String(value) }
          : {
              type: "flat" as const,
              amount: String(value * 100),
              currencyCode: "USD" as const,
            }),
        ...(input.maxRedemptions
          ? { usageLimit: input.maxRedemptions }
          : {}),
        ...(expiresAt ? { expiresAt: expiresAt.toISOString() } : {}),
      });
      paddleDiscountId = discount.id;
    } catch (e) {
      return {
        error: `Paddle refused the discount: ${
          e instanceof Error ? e.message : "unknown error"
        }`,
      };
    }
  }

  await db.insert(promoCodes).values({
    code,
    name,
    kind: input.kind,
    // Money amounts are stored in cents; percent and days as given.
    value: input.kind === "amount" ? value * 100 : value,
    paddleDiscountId,
    maxRedemptions: input.maxRedemptions,
    expiresAt,
  });

  revalidatePath("/admin");
  return { error: null, message: `"${code}" is live.` };
}

/**
 * Retire a code. Archived rather than deleted, so redemption history
 * survives; the matching Paddle discount is archived too, so the code
 * stops working at checkout the same moment it disappears here.
 */
export async function adminArchivePromoCode(
  id: string
): Promise<AdminActionResult> {
  await requireAdmin();

  const row = await db.query.promoCodes.findFirst({
    where: eq(promoCodes.id, id),
  });
  if (!row) return { error: "That code is already gone." };

  if (row.paddleDiscountId && isBillingConfigured()) {
    try {
      await paddle().discounts.archive(row.paddleDiscountId);
    } catch (e) {
      return {
        error: `Paddle would not archive the discount, so the code is still live: ${
          e instanceof Error ? e.message : "unknown error"
        }`,
      };
    }
  }

  await db
    .update(promoCodes)
    .set({ archivedAt: new Date() })
    .where(eq(promoCodes.id, id));

  revalidatePath("/admin");
  return { error: null, message: `"${row.code}" retired.` };
}
