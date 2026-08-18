import { type NextRequest } from "next/server";

/** Hostnames only — no IPs, ports, paths, or credentials. */
const DOMAIN_RE =
  /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;

const WEEK_SECONDS = 60 * 60 * 24 * 7;

/**
 * Company logo proxy.
 *
 * The upstream favicon service answers unknown domains with 404 *and* a
 * generic globe in the body, which browsers happily render — so leads with
 * no logo showed a meaningless placeholder instead of falling back to their
 * initials. Proxying lets a miss be an empty 404 that reliably triggers the
 * image's error handler. It also keeps the lookup server-side, so a rep's
 * browser isn't announcing every customer domain to a third party.
 */
export async function GET(request: NextRequest) {
  const domain = (
    request.nextUrl.searchParams.get("domain") ?? ""
  ).toLowerCase();

  if (!DOMAIN_RE.test(domain) || domain.endsWith(".local")) {
    return new Response(null, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`https://icons.duckduckgo.com/ip3/${domain}.ico`, {
      next: { revalidate: WEEK_SECONDS },
    });
  } catch {
    return new Response(null, { status: 404 });
  }

  if (!upstream.ok) {
    return new Response(null, { status: 404 });
  }

  const body = await upstream.arrayBuffer();

  // A zero-length body is a miss too.
  if (body.byteLength === 0) {
    return new Response(null, { status: 404 });
  }

  return new Response(body, {
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "image/x-icon",
      "cache-control": `public, max-age=${WEEK_SECONDS}, immutable`,
    },
  });
}
