/**
 * Paddle PRODUCTION price ids.
 *
 * One price since the flat-pricing move of 08-27-2026: $14 per user per
 * month, quantity carries the seat count. Prices are immutable once
 * used; correcting one means creating a NEW price and pointing this
 * block at it, never editing the old one.
 *
 * LEGACY lists the pre-flat catalog. Kept only so the archive script
 * and any forensic reading of old subscriptions can name them.
 */
export const PRICES = {
  flat: {
    monthly: "pri_01m1265yb8vn5swb11er61m7sc",
  },
} as const;

export const LEGACY_PRICES = [
  "pri_01m0tw7rjy8mvwym6nkkw8p8p4",
  "pri_01m0tw7rrgtvwkvhqh4sdvdj4c",
  "pri_01m0tw7s3fpawjxg09b4j085f4",
  "pri_01m0tw7s8qrdewdetxt491a8b1",
  "pri_01m0tw7se1qccp7vmk2gj28z87",
  "pri_01m0tw7skhzyb69b344v050enr",
  "pri_01m0tw7srz7wankz4htsrgcpg8",
  "pri_01m0tw7sy8hzj5c38afsdg7xyw",
] as const;

/** The price to charge. With flat pricing there is exactly one answer. */
export function priceFor(): string {
  return PRICES.flat.monthly;
}
