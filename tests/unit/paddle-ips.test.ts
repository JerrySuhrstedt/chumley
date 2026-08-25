import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The address check in front of the Paddle webhook.
 *
 * Two things have to hold. It must reject an address Paddle does not own,
 * or it is decorative. And it must never reject when the list cannot be
 * fetched, because refusing real subscription events over an unrelated HTTP
 * failure costs paying customers their access, and the signature check is
 * the control that actually stops a forgery.
 */
const LIVE = ["34.237.3.244/32", "34.195.105.136/32", "52.11.166.252/32"];
const SANDBOX = ["3.208.120.145/32", "54.234.237.108/32"];

const mockIps = (cidrs: string[]) =>
  // Typed with the arguments fetch actually receives, so the assertion
  // below can read which URL was called.
  vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
    new Response(JSON.stringify({ data: { ipv4_cidrs: cidrs } }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })
  );

async function freshModule() {
  // The module caches the list for an hour, so each case needs its own copy.
  vi.resetModules();
  return import("@/lib/paddle/ips");
}

describe("checkPaddleIp", () => {
  const realFetch = globalThis.fetch;
  beforeEach(() => {
    process.env.PADDLE_ENV = "production";
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
    vi.restoreAllMocks();
  });

  it("allows a genuine Paddle address", async () => {
    globalThis.fetch = mockIps(LIVE) as unknown as typeof fetch;
    const { checkPaddleIp } = await freshModule();
    const r = await checkPaddleIp(new Headers({ "x-real-ip": "34.237.3.244" }));
    expect(r.verdict).toBe("allowed");
  });

  it("rejects anything else", async () => {
    globalThis.fetch = mockIps(LIVE) as unknown as typeof fetch;
    const { checkPaddleIp } = await freshModule();
    const r = await checkPaddleIp(new Headers({ "x-real-ip": "203.0.113.9" }));
    expect(r.verdict).toBe("rejected");
  });

  it("does not reject when the list cannot be fetched", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;
    const { checkPaddleIp } = await freshModule();
    const r = await checkPaddleIp(new Headers({ "x-real-ip": "203.0.113.9" }));
    expect(r.verdict).toBe("unverified");
  });

  it("reads the sandbox list when the environment is sandbox", async () => {
    // The two accounts share no addresses, so reading the wrong list would
    // reject every webhook actually received.
    process.env.PADDLE_ENV = "sandbox";
    const spy = mockIps(SANDBOX);
    globalThis.fetch = spy as unknown as typeof fetch;
    const { checkPaddleIp } = await freshModule();
    const r = await checkPaddleIp(new Headers({ "x-real-ip": "3.208.120.145" }));
    expect(r.verdict).toBe("allowed");
    expect(String(spy.mock.calls[0]?.[0] ?? "")).toContain(
      "sandbox-api.paddle.com"
    );
  });

  it("prefers x-real-ip, which the platform sets, over x-forwarded-for", async () => {
    globalThis.fetch = mockIps(LIVE) as unknown as typeof fetch;
    const { checkPaddleIp } = await freshModule();
    const r = await checkPaddleIp(
      new Headers({
        "x-real-ip": "34.237.3.244",
        "x-forwarded-for": "203.0.113.9",
      })
    );
    expect(r.verdict).toBe("allowed");
  });

  it("takes only the leftmost x-forwarded-for entry", async () => {
    globalThis.fetch = mockIps(LIVE) as unknown as typeof fetch;
    const { checkPaddleIp } = await freshModule();
    const r = await checkPaddleIp(
      new Headers({ "x-forwarded-for": "34.237.3.244, 10.0.0.1, 10.0.0.2" })
    );
    expect(r.verdict).toBe("allowed");
  });

  it("cannot judge an address it was never given", async () => {
    globalThis.fetch = mockIps(LIVE) as unknown as typeof fetch;
    const { checkPaddleIp } = await freshModule();
    expect((await checkPaddleIp(new Headers())).verdict).toBe("unverified");
  });
});
