import { config } from "dotenv";
import { Environment, Paddle } from "@paddle/paddle-node-sdk";
config({ path: ".env.local" });

/**
 * The flat-pricing move of 08-27-2026: one price, $14 per user per month.
 *
 * Creates the single new price on the live account. Deliberately does NOT
 * archive the six old prices: the deployed site still points at them until
 * the flat-pricing code ships, and archiving early would break its
 * checkout. scripts/archive-old-prices.mts does that half, after deploy.
 */
const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: Environment.production,
});

const SOLO_PRODUCT = "pro_01m0tw7rcmzmp1b648xwnk5c5b";

const product = await paddle.products.get(SOLO_PRODUCT);
console.log("product:", product.id, "|", product.name);

const p = await paddle.prices.create({
  productId: SOLO_PRODUCT,
  description: "Chumley — $14 per user per month",
  unitPrice: { amount: "1400", currencyCode: "USD" },
  billingCycle: { interval: "month", frequency: 1 },
  trialPeriod: { interval: "day", frequency: 14 },
  quantity: { minimum: 1, maximum: 100 },
});
console.log("NEW FLAT PRICE:", p.id);
