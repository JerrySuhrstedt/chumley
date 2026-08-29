import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * A team id, signed so the Paddle webhook can trust it.
 *
 * The overlay checkout sets customData in the browser, so a raw orgId there
 * is attacker-controlled: anyone signed in could open checkout with another
 * team's id and have the signed webhook attach, or later cancel, a
 * subscription on that team. Signing the id server-side, where it comes from
 * the session, means the webhook only ever accepts an id it minted for the
 * team the caller actually belongs to. An unsigned or forged value verifies
 * to null and the webhook falls back to the customer-id route, which is
 * keyed on data we recorded ourselves.
 *
 * BETTER_AUTH_SECRET is already required in production (see lib/auth.ts), so
 * there is no new secret to manage.
 */
function secret(): string {
  const s = process.env.BETTER_AUTH_SECRET;
  if (!s) throw new Error("BETTER_AUTH_SECRET is not set");
  return s;
}

function mac(orgId: string): string {
  return createHmac("sha256", secret()).update(orgId).digest("base64url");
}

export function signOrgId(orgId: string): string {
  return `${orgId}.${mac(orgId)}`;
}

export function verifyOrgToken(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const orgId = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(mac(orgId));
  if (given.length !== expected.length) return null;
  return timingSafeEqual(given, expected) ? orgId : null;
}
