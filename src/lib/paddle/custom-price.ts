import { paddle } from "@/lib/paddle/server";
import { PRICES } from "@/lib/paddle/catalog";

/**
 * Bespoke prices, as real Paddle objects.
 *
 * Paddle will only charge against a price it holds, so "give my friend
 * this for $2" cannot live purely in our database: something has to exist
 * on their side for the subscription to point at. This creates it.
 *
 * Two rejected alternatives, both of which look simpler and are not:
 *
 * A percentage discount gets the money right and the arithmetic wrong. To
 * reach $2 from $19 is 89.473...%, which does not exist, and the nearest
 * legal value bills $2.01 forever. Discounts also carry their own duration
 * rules, so the price would quietly revert on a schedule nobody set.
 *
 * An inline non-catalog price would avoid the catalog entirely, but those
 * can only be attached to a transaction built server-side, which means
 * abandoning Paddle.js overlay checkout for a redirect flow. That is a
 * large change to the thing customers actually touch, in exchange for
 * tidiness nobody sees.
 *
 * So: catalog prices, created on demand, and reused. Two teams on $2 share
 * one price object rather than minting a second identical one, which keeps
 * the catalog readable when this has been used twenty times.
 */

/** The bill this covers. Solo product, because a bespoke price is per seat. */
const PRODUCT_HINT = PRICES.solo.monthly;

const marker = (cents: number, trialDays: number) =>
  trialDays > 0
    ? `Chumley custom ${cents}c per seat monthly, ${trialDays}d trial`
    : `Chumley custom ${cents}c per seat monthly`;

let productIdCache: string | null = null;

/** The product bespoke prices hang off: whichever one the solo price belongs to. */
async function productId(): Promise<string> {
  if (productIdCache) return productIdCache;
  const price = await paddle().prices.get(PRODUCT_HINT);
  const id = price.productId;
  if (!id) throw new Error("Could not find the product for custom prices.");
  productIdCache = id;
  return id;
}

/**
 * The Paddle price id for this amount, creating it the first time.
 *
 * Matched on an exact description rather than on the number, because two
 * prices can share an amount and mean different things, and a description
 * we wrote ourselves is the only field here we fully control.
 */
export async function ensureCustomPrice(
  cents: number,
  /**
   * Days of trial before the first charge. Zero, the default, charges at
   * checkout, which is what a negotiated price normally wants: the trial
   * already happened before anybody negotiated anything.
   *
   * The exception is testing. A one-day trial is the only way to watch a
   * real card actually get charged without waiting a fortnight for the
   * catalog prices to come due, and the trial length is part of the price
   * in Paddle, so it cannot be changed afterwards.
   */
  trialDays = 0
): Promise<string> {
  if (!Number.isInteger(cents) || cents < 1) {
    throw new Error("A custom price must be a whole number of cents above zero.");
  }
  if (!Number.isInteger(trialDays) || trialDays < 0 || trialDays > 365) {
    throw new Error("Trial days must be a whole number between 0 and 365.");
  }

  // The trial is part of the marker, so two prices at the same amount with
  // different trials stay distinct rather than one silently standing in
  // for the other.
  const want = marker(cents, trialDays);
  const product = await productId();

  for await (const p of paddle().prices.list({ productId: [product] })) {
    if (p.description === want && p.status === "active") return p.id;
  }

  const created = await paddle().prices.create({
    productId: product,
    description: want,
    unitPrice: { amount: String(cents), currencyCode: "USD" },
    billingCycle: { interval: "month", frequency: 1 },
    // Normally no trial. A team moved onto a negotiated price has already
    // had whatever trial they were going to get, and handing them another
    // by accident is free service nobody decided to give.
    ...(trialDays > 0
      ? { trialPeriod: { interval: "day" as const, frequency: trialDays } }
      : {}),
  });

  return created.id;
}

/** $2 -> "200". Rejects anything that is not money. */
export function dollarsToCents(input: string): number | null {
  const cleaned = input.trim().replace(/^\$/, "");
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(cleaned)) return null;
  const cents = Math.round(Number(cleaned) * 100);
  return Number.isFinite(cents) && cents > 0 ? cents : null;
}

export const centsToDollars = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
