import { TEAM_TIERS, tierFor } from "@/app/(marketing)/pricing/plans";

/**
 * Paddle sandbox price IDs, created by scripts/seed-paddle-catalog.ts.
 *
 * Sandbox and production have entirely separate catalogs, so none of these
 * exist live. Going live means running the seed against production and
 * replacing this block, which is why it sits in one file rather than
 * scattered through the checkout.
 *
 * Paddle holds one unit price per price object and has no concept of a
 * volume ladder, so every break on the pricing page is its own price and
 * the checkout picks whichever matches the seat count.
 */
export const PRICES = {
  solo: {
    monthly: "pri_01m0dtmkv0ph4s7f6jf0sqaegr",
    yearly: "pri_01m0dtmm0b9djmdy90961y40md",
  },
  team: {
    "3to4": {
      monthly: "pri_01m0dtmmaqxwbvyfa37p199vc6",
      yearly: "pri_01m0dtmmfajkmrrrgwjc09bw93",
    },
    "5to9": {
      monthly: "pri_01m0dtmmm1svwmdtbnpbz58gmm",
      yearly: "pri_01m0dtmmqjx3pcp09qwqhra1m1",
    },
    "10plus": {
      monthly: "pri_01m0dtmmw4q4ykepw86wzmn00s",
      yearly: "pri_01m0dtmn6f7a9kv344qa9bf33t",
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
