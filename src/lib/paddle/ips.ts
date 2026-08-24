/**
 * Paddle's webhook source addresses, fetched rather than hard-coded.
 *
 * Paddle publishes the current list at api.paddle.com/ips and reserves the
 * right to change it, so a list pasted into source goes stale silently and
 * the first symptom is subscriptions that stop syncing. We fetch it and
 * cache it instead.
 *
 * This is defence in depth, not the actual control. The signature check in
 * the route is what makes a forged event impossible; an address check only
 * turns away noise before we spend a signature verification on it. That
 * ordering matters for the failure case below.
 */

const SOURCE = "https://api.paddle.com/ips";
const TTL_MS = 60 * 60 * 1000; // An hour. The list changes rarely.

let cache: { at: number; cidrs: string[] } | null = null;
let inFlight: Promise<string[]> | null = null;

async function load(): Promise<string[]> {
  const res = await fetch(SOURCE, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) throw new Error(`paddle ips: HTTP ${res.status}`);
  const body = (await res.json()) as { data?: { ipv4_cidrs?: string[] } };
  const cidrs = body.data?.ipv4_cidrs;
  if (!Array.isArray(cidrs) || cidrs.length === 0) {
    throw new Error("paddle ips: empty list");
  }
  return cidrs;
}

async function cidrs(): Promise<string[] | null> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.cidrs;
  // One fetch at a time. A burst of webhooks should not become a burst of
  // outbound requests to Paddle.
  inFlight ??= load()
    .then((list) => {
      cache = { at: Date.now(), cidrs: list };
      return list;
    })
    .finally(() => {
      inFlight = null;
    });

  try {
    return await inFlight;
  } catch (error) {
    console.error("paddle ip list unavailable", error);
    // Serve a stale list rather than nothing, if we ever had one.
    return cache?.cidrs ?? null;
  }
}

function toInt(ip: string): number | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const v = Number(p);
    if (v > 255) return null;
    n = n * 256 + v;
  }
  return n >>> 0;
}

function inCidr(ip: number, cidr: string): boolean {
  const [base, bitsRaw] = cidr.split("/");
  const b = toInt(base);
  if (b === null) return false;
  const bits = Number(bitsRaw ?? 32);
  if (!Number.isInteger(bits) || bits < 0 || bits > 32) return false;
  if (bits === 0) return true;
  const mask = (0xffffffff << (32 - bits)) >>> 0;
  return (ip & mask) === (b & mask);
}

/**
 * The caller's address, as the platform reports it.
 *
 * x-real-ip is set by Vercel itself and cannot be spoofed by the client, so
 * it is preferred. x-forwarded-for is the fallback, and only its leftmost
 * entry is meaningful.
 */
export function callerIp(headers: Headers): string | null {
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = headers.get("x-forwarded-for");
  return fwd ? (fwd.split(",")[0]?.trim() ?? null) : null;
}

export type IpVerdict = "allowed" | "rejected" | "unverified";

/**
 * Whether this request came from Paddle.
 *
 * Returns "unverified" when we could not obtain a list or read an address.
 * The route treats that as "carry on to the signature check" on purpose:
 * blocking real subscription events because api.paddle.com was briefly
 * unreachable would cost paying customers their access, and the signature
 * check still stands between us and a forgery. A hard block here would be
 * trading a real failure mode for a theoretical one.
 */
export async function checkPaddleIp(headers: Headers): Promise<{
  verdict: IpVerdict;
  ip: string | null;
}> {
  const ip = callerIp(headers);
  if (!ip) return { verdict: "unverified", ip: null };

  const n = toInt(ip);
  if (n === null) return { verdict: "unverified", ip }; // IPv6, most likely.

  const list = await cidrs();
  if (!list) return { verdict: "unverified", ip };

  return {
    verdict: list.some((c) => inCidr(n, c)) ? "allowed" : "rejected",
    ip,
  };
}
