import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/** The live brand. Anything arriving on an old host is sent here. */
const CANONICAL_HOST = "chumley.app";
const LEGACY_HOSTS = new Set([
  "sell1.app",
  "www.sell1.app",
  "uncrm.app",
  "www.uncrm.app",
  "stupid-simple-crm.vercel.app",
]);

/**
 * The request gate that replaced Supabase's session middleware.
 *
 * The old version phoned Supabase's auth API on every request to refresh
 * the session, which is why their gateway incident froze every page of
 * the app at once. This one reads the session cookie's presence and
 * nothing else: no network call, nothing to time out, and the real
 * cryptographic check happens in the page's own getSession call against
 * our own database.
 *
 * A forged cookie therefore gets past this file and no further: the page
 * asks Better Auth for the session, finds nothing, and renders as
 * signed-out. The cookie check here only decides which door to show.
 */
export function gate(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase() ?? "";

  // Old domains still resolve to this project. Forward them, query string
  // intact, so links in old emails still land.
  if (LEGACY_HOSTS.has(host)) {
    const url = request.nextUrl.clone();
    url.host = CANONICAL_HOST;
    url.port = "";
    url.protocol = "https";
    return NextResponse.redirect(url, 308);
  }

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith("/login");
  const isPublicRoute =
    isAuthRoute ||
    // The marketing pages are the front door, open to everyone. The legal
    // pages in particular must answer without a redirect, because reviewers
    // and crawlers fetch them while signed out.
    pathname === "/" ||
    pathname === "/pricing" ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname === "/refunds" ||
    // The SEO pages: comparison, use-case and vertical landing pages, and
    // the guides. All marketing, all open to everyone. Behind the gate they
    // would 307 a signed-out crawler to /login and never get indexed, which
    // is the whole reason they exist.
    pathname.startsWith("/compare/") ||
    pathname.startsWith("/for/") ||
    pathname === "/guides" ||
    pathname.startsWith("/guides/") ||
    // Free tools. Same reasoning, and more so: the whole point of a
    // giveaway is that a stranger can reach it without an account.
    pathname === "/tools" ||
    pathname.startsWith("/tools/") ||
    // Crawler plumbing. A robots.txt that redirects to a login page is
    // how a site tells Google it has nothing worth indexing.
    // The outside uptime watcher must reach this without a session.
    pathname === "/api/health" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    // The AI-crawler manifest and the IndexNow key file, both fetched by
    // machines with no session.
    pathname === "/llms.txt" ||
    pathname === "/12d0103a70c41e0d0b1ed955783db640.txt" ||
    // The embeddable website form is public by definition.
    pathname.startsWith("/f/") ||
    // The hidden tester punch list. Testers are outsiders with no account;
    // the page is unlinked and noindexed, not secret, and stores nothing
    // sensitive.
    pathname === "/uat" ||
    // Personal tester links: /uat/{token}. Same standing as /uat itself.
    pathname.startsWith("/uat/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/join/") ||
    pathname.startsWith("/api/webhooks/") ||
    // A page that has already crashed cannot prove who it is, so the
    // endpoint it reports to has to answer without a session. Behind the
    // gate it would 307 to the login screen and the report would be lost,
    // which is the exact failure the reporting exists to catch.
    pathname === "/api/client-error" ||
    // Development-only visual harness. The page itself 404s in production,
    // so this only opens a door that leads nowhere once deployed.
    pathname === "/coach-harness";

  const hasSession = Boolean(getSessionCookie(request));

  if (!hasSession && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/pipeline";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
