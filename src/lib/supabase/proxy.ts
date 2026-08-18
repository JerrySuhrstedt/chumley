import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** The live brand. Anything arriving on an old host is sent here. */
const CANONICAL_HOST = "sell1.app";
const LEGACY_HOSTS = new Set(["uncrm.app", "www.uncrm.app", "stupid-simple-crm.vercel.app"]);

export async function updateSession(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase() ?? "";

  // Old domains still resolve to this project. Forward them, query string
  // intact, so an auth code issued against a stale Site URL still lands.
  if (LEGACY_HOSTS.has(host)) {
    const url = request.nextUrl.clone();
    url.host = CANONICAL_HOST;
    url.port = "";
    url.protocol = "https";
    return NextResponse.redirect(url, 308);
  }

  // Supabase falls back to the project's Site URL when a redirect target is
  // not allow-listed, which drops the code on "/" instead of /auth/confirm.
  // Catch it here so sign-in completes regardless of that setting.
  if (request.nextUrl.pathname === "/" && request.nextUrl.searchParams.has("code")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/confirm";
    url.searchParams.set("next", "/pipeline");
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith("/login");
  const isPublicRoute =
    isAuthRoute ||
    // The marketing pages are the front door, open to everyone. The legal
    // pages in particular must answer without a redirect, because reviewers
    // and crawlers fetch them while signed out.
    pathname === "/" ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/join/") ||
    pathname.startsWith("/api/webhooks/");

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/pipeline";
    return NextResponse.redirect(url);
  }

  return response;
}
