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
 *
 * This one touches PRODUCTION Paddle and creates a real price customers can
 * be charged against, so it refuses to run without an explicit --production
 * flag. Mirrors scripts/seed-paddle-catalog.ts: the flag is deliberately not
 * an env var, and the API key must actually be a live key (pdl_live_), since
 * a stray variable or a sandbox key should never be enough to write to the
 * live catalog by itself.
 */
const LIVE = process.argv.includes("--production");

if (!LIVE) {
  throw new Error(
    "This creates a real price on the LIVE Paddle account. Re-run with --production if you mean it."
  );
}

const key = process.env.PADDLE_API_KEY;
if (!key) {
  throw new Error("PADDLE_API_KEY is not set in .env.local");
}
if (!key.startsWith("pdl_live_")) {
  throw new Error(
    key.startsWith("pdl_sdbx_")
      ? "--production was passed but PADDLE_API_KEY is a SANDBOX key (pdl_sdbx_...). Use the live key from vendors.paddle.com."
      : `--production needs a live key beginning pdl_live_. Got something starting "${key.slice(0, 9)}", which is not a Paddle API key at all.`
  );
}

console.log(
  "\n*** PRODUCTION. This creates a real price on the live catalog. ***\n"
);

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
