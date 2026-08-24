import { config } from "dotenv";
import { Environment, Paddle } from "@paddle/paddle-node-sdk";

config({ path: ".env.local" });

/**
 * Creates the Chumley catalog in Paddle.
 *
 * Two products, six prices. Paddle carries one unit price per price object
 * and has no notion of a volume ladder, so each break on the pricing page
 * is its own price and the checkout picks whichever matches the seat count.
 * That is the standard way to do this, and it keeps the arithmetic on our
 * side where the page can already show it.
 *
 * Amounts are strings in cents. "1900" is $19.00, not $1,900.
 *
 * Safe to look at before running. It only creates; it never edits or
 * deletes, so a second run makes duplicates rather than damage.
 *
 * Sandbox unless you pass --production, and the flag is deliberately not
 * PADDLE_ENV: a stray environment variable should never be enough to create
 * a live catalog by itself. The API key has to match the target, because
 * sandbox and production keys are not interchangeable.
 */
const LIVE = process.argv.includes("--production");

const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: LIVE ? Environment.production : Environment.sandbox,
});

const TRIAL = { interval: "day" as const, frequency: 14 };
const MONTH = { interval: "month" as const, frequency: 1 };
const YEAR = { interval: "year" as const, frequency: 1 };

async function price(
  productId: string,
  description: string,
  cents: string,
  cycle: typeof MONTH | typeof YEAR
) {
  const p = await paddle.prices.create({
    productId,
    description,
    unitPrice: { amount: cents, currencyCode: "USD" },
    billingCycle: cycle,
    trialPeriod: TRIAL,
  });
  console.log(`  ${description.padEnd(34)} ${p.id}`);
  return p.id;
}

async function seed() {
  if (!process.env.PADDLE_API_KEY) {
    throw new Error("PADDLE_API_KEY is not set in .env.local");
  }

  const key = process.env.PADDLE_API_KEY;

  // The key itself says which environment it belongs to. Catching a mismatch
  // here is worth it, because the failure it prevents is a live catalog full
  // of duplicates, or a sandbox key quietly making nothing at all.
  if (LIVE && key.startsWith("pdl_sdbx_")) {
    throw new Error(
      "--production was passed but PADDLE_API_KEY is a sandbox key (pdl_sdbx_...). Put the live key in .env.local first."
    );
  }
  if (!LIVE && !key.startsWith("pdl_sdbx_")) {
    throw new Error(
      "PADDLE_API_KEY does not look like a sandbox key. Pass --production if you really mean to create the live catalog."
    );
  }

  console.log(
    LIVE
      ? "\n*** PRODUCTION. This creates the real catalog customers will be charged against. ***\n"
      : "\nSandbox.\n"
  );

  console.log("Creating Solo...");
  const solo = await paddle.products.create({
    name: "Chumley for one person",
    taxCategory: "saas",
    description: "The whole of Chumley, for a single salesperson.",
  });
  const soloMonthly = await price(solo.id, "Solo monthly", "1900", MONTH);
  const soloYearly = await price(solo.id, "Solo yearly", "19000", YEAR);

  console.log("\nCreating Team...");
  const team = await paddle.products.create({
    name: "Chumley for a sales team",
    taxCategory: "saas",
    description: "The whole of Chumley, priced per person, for a team.",
  });

  const tiers = [
    { key: "3to4", monthly: "1500", yearly: "15000" },
    { key: "5to9", monthly: "1300", yearly: "13000" },
    { key: "10plus", monthly: "1100", yearly: "11000" },
  ];

  const teamPrices: Record<string, { monthly: string; yearly: string }> = {};
  for (const t of tiers) {
    teamPrices[t.key] = {
      monthly: await price(team.id, `Team ${t.key} monthly`, t.monthly, MONTH),
      yearly: await price(team.id, `Team ${t.key} yearly`, t.yearly, YEAR),
    };
  }

  console.log(
    `\n\nPaste this into src/lib/paddle/catalog.ts (${LIVE ? "PRODUCTION" : "sandbox"} ids):\n`
  );
  console.log(
    JSON.stringify(
      {
        solo: { monthly: soloMonthly, yearly: soloYearly },
        team: teamPrices,
      },
      null,
      2
    )
  );
}

seed().catch((e) => {
  console.error("\nFailed:", e?.message ?? e);
  console.error(
    "\nIf this says forbidden, the API key is missing the product.write and price.write scopes."
  );
  process.exit(1);
});
