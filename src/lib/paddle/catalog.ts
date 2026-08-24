import { TEAM_TIERS, tierFor } from "@/app/(marketing)/pricing/plans";

/**
 * Paddle PRODUCTION price IDs, created by scripts/seed-paddle-catalog.ts
 * on 08-24-2026 against the live account.
 *
 * These are real. A checkout opened against them bills a real card once the
 * account is verified and the domain approved.
 *
 * Sandbox and production have entirely separate catalogs and none of these
 * ids exist in sandbox, which is why local development keeps PADDLE_ENV on
 * sandbox and simply never reaches this file's checkout path.
 *
 * Paddle holds one unit price per price object and has no concept of a
 * volume ladder, so every break on the pricing page is its own price and
 * the checkout picks whichever matches the seat count.
 *
 * Prices are immutable once used. Correcting one means creating a NEW price
 * and pointing this block at it, never editing or deleting the old one.
 */
export const PRICES = {
  solo: {
    monthly: "pri_01m0tw7rjy8mvwym6nkkw8p8p4",
    yearly: "pri_01m0tw7rrgtvwkvhqh4sdvdj4c",
  },
  team: {
    "3to4": {
      monthly: "pri_01m0tw7s3fpawjxg09b4j085f4",
      yearly: "pri_01m0tw7s8qrdewdetxt491a8b1",
    },
    "5to9": {
      monthly: "pri_01m0tw7se1qccp7vmk2gj28z87",
      yearly: "pri_01m0tw7skhzyb69b344v050enr",
    },
    "10plus": {
      monthly: "pri_01m0tw7srz7wankz4htsrgcpg8",
      yearly: "pri_01m0tw7sy8hzj5c38afsdg7xyw",
    },
  },
} as const;

/** Keyed the same way the pricing ladder is, so the two cannot drift. */
function tierKey(seats: number): keyof typeof PRICES.team {
  const tier = tierFor(seats);
  const index = TEAM_TIERS.findIndex((t) => t.min === tier.min);
  return (["3to4", "5to9", "10plus"] as const)[index] ?? "3to4";
}

/**
 * The price to charge, given what the buyer chose on the pricing page.
 * One seat is always the solo price; anything more takes the team ladder.
 */
export function priceFor(seats: number, yearly: boolean): string {
  const period = yearly ? "yearly" : "monthly";
  if (seats <= 1) return PRICES.solo[period];
  return PRICES.team[tierKey(seats)][period];
}
