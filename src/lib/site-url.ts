import { headers } from "next/headers";

/**
 * The origin this request arrived on, e.g. https://sell1.app.
 *
 * The "origin" header looks like the obvious source and is not: browsers
 * only send it on cross-origin requests and POSTs, so a plain page visit
 * has none and reading it yields null. Build it from the host instead,
 * honouring the proxy headers Vercel sets.
 */
export async function getOrigin(): Promise<string> {
  const h = await headers();

  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "sell1.app";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");

  return `${proto}://${host}`;
}
