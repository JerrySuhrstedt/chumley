import { NextResponse } from "next/server";
import { paddle } from "@/lib/paddle/server";
import { checkPaddleIp } from "@/lib/paddle/ips";
import { syncPaddleEvent } from "@/lib/paddle/sync";

/**
 * Paddle's webhook endpoint.
 *
 * Every request is verified against the signing secret before anything is
 * read from it. This URL is public by necessity, so without that check
 * anyone who found it could post a forged "subscription.created" and hand
 * themselves a paid account.
 *
 * A 200 is returned for anything that verified, including events we do not
 * act on. Paddle retries non-2xx responses, and retrying an event that was
 * received correctly and simply ignored achieves nothing but noise.
 *
 * There is an address check in front of the signature check, using the list
 * Paddle publishes. It is a cheap way to drop scanner traffic before doing
 * crypto on it, and it is deliberately advisory: if the list cannot be
 * reached we fall through to the signature, which is the real control.
 */
export async function POST(request: Request) {
  const { verdict, ip } = await checkPaddleIp(request.headers);
  if (verdict === "rejected") {
    console.error("paddle webhook from unexpected address", ip);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    // Fail closed. An unverifiable endpoint should refuse, not guess.
    return NextResponse.json(
      { error: "Billing webhooks are not configured" },
      { status: 503 }
    );
  }

  const signature = request.headers.get("paddle-signature");
  if (!signature) {
    return NextResponse.json({ error: "Unsigned" }, { status: 401 });
  }

  // The raw body, exactly as sent. Parsing it first would change the bytes
  // the signature was computed over.
  const body = await request.text();

  let event;
  try {
    event = await paddle().webhooks.unmarshal(body, secret, signature);
  } catch {
    return NextResponse.json({ error: "Bad signature" }, { status: 401 });
  }

  if (!event) {
    return NextResponse.json({ error: "Bad signature" }, { status: 401 });
  }

  try {
    const result = await syncPaddleEvent(event);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    // A genuine failure on our side. Returning 500 asks Paddle to retry,
    // which is what we want, because the event is real and unrecorded.
    console.error("paddle webhook failed", event.eventType, error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
