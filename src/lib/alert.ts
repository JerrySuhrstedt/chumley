import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Telling a human that billing broke.
 *
 * The gap this closes is specific: everything in the billing path already
 * fails correctly, returning a 500 so Paddle retries and writing a line to
 * the platform log. What none of it does is reach anybody. A webhook that
 * exhausts its retries at 2am is discovered when the money stops, and the
 * only reason it was ever going to be discovered sooner is somebody
 * happening to read Vercel's logs, which nobody does.
 *
 * Three rules this file follows, all of them learned from alerting that
 * made things worse:
 *
 * It never throws. An alerter that can break the thing it watches is a
 * liability, so every failure here is swallowed and logged. A missed email
 * about a broken webhook is bad; a broken webhook caused by a missed email
 * is worse.
 *
 * It never blocks. The caller is usually inside a request Paddle is timing,
 * and waiting on an SMTP round trip to tell somebody the request went badly
 * is a good way to make the request go badly.
 *
 * It throttles hard, on a key naming the kind of problem rather than the
 * instance. Paddle retries, so an unthrottled alert on a failing webhook
 * sends one email per delivery per event until the inbox is useless, which
 * is indistinguishable from no alerting at all.
 */

const TO = "info@sumolab.co";
const FROM = process.env.ALERT_FROM ?? "Chumley <onboarding@resend.dev>";
const THROTTLE_MINUTES = 15;

/**
 * Claim the right to send this alert, or find somebody already has.
 *
 * The staleness test lives in the WHERE of the upsert rather than in a read
 * followed by a write, so two functions failing at the same moment cannot
 * both decide they are the one to send.
 */
async function claim(key: string): Promise<boolean> {
  return claimThrottle(key, THROTTLE_MINUTES);
}

/**
 * The same atomic once-per-window claim, open to callers that want to
 * rate-limit something other than an alert (e.g. one tracker email per
 * IP per window). Reuses alert_log rather than a second table: the row
 * is a timestamp under a key, which is all a throttle is. Returns true
 * if the caller may proceed, false if somebody already claimed this
 * window.
 */
export async function claimThrottle(
  key: string,
  minutes: number
): Promise<boolean> {
  const rows = await db.execute(sql`
    INSERT INTO alert_log (key, last_sent_at)
    VALUES (${key}, now())
    ON CONFLICT (key) DO UPDATE SET last_sent_at = now()
      WHERE alert_log.last_sent_at
            < now() - (${minutes} || ' minutes')::interval
    RETURNING key
  `);
  return (rows as unknown as unknown[]).length > 0;
}

async function deliver(subject: string, body: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // Not configured. Say so once, clearly, rather than failing silently
    // and leaving somebody to wonder why no mail ever arrives.
    console.error(`[alert, not sent, RESEND_API_KEY unset] ${subject}\n${body}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [TO],
      subject,
      text: body,
    }),
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) {
    console.error("alert email rejected", res.status, await res.text());
  }
}

/**
 * Send an alert, at most once per key per throttle window.
 *
 * Deliberately not awaited by callers. Returns a promise so tests can wait
 * on it, but nothing in a request path should.
 */
export async function alert(
  key: string,
  subject: string,
  body: string
): Promise<void> {
  try {
    if (!(await claim(key))) return;
    await deliver(
      subject,
      `${body}\n\n---\nChumley alert "${key}". Repeats are suppressed for ${THROTTLE_MINUTES} minutes.\nhttps://chumley.app/admin`
    );
  } catch (e) {
    console.error("alerting itself failed", key, e);
  }
}

/** Fire and forget, for the request paths that must not wait. */
export function alertAsync(key: string, subject: string, body: string): void {
  void alert(key, subject, body);
}
