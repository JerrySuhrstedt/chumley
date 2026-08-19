import { Environment, Paddle } from "@paddle/paddle-node-sdk";

/**
 * Server-side Paddle client, used only for writes: cancelling, changing a
 * plan, adding seats. Reads come from our own mirror of the subscription,
 * because a round trip to Paddle to answer "is this team paid up" would put
 * their latency on every page load.
 *
 * Sandbox until PADDLE_ENV says otherwise, so a misconfigured deploy fails
 * toward the test environment rather than toward real money.
 */
export function paddle() {
  const key = process.env.PADDLE_API_KEY;
  if (!key) {
    throw new Error("PADDLE_API_KEY is not set");
  }

  return new Paddle(key, {
    environment:
      process.env.PADDLE_ENV === "production"
        ? Environment.production
        : Environment.sandbox,
  });
}

export function isBillingConfigured() {
  return Boolean(process.env.PADDLE_API_KEY);
}
