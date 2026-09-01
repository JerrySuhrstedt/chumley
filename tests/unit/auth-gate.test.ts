import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { gate } from "@/lib/auth-gate";

/**
 * The public-route allowlist, locked down. AGENTS.md records this list
 * eating static files four times, including a .xlsx that came back as the
 * login page wearing an .xlsx extension. A signed-out request to a public
 * path must pass through; to a private path it must redirect to /login.
 */

function reqTo(path: string): NextRequest {
  // No session cookie, so hasSession is false and the gate decides purely
  // on whether the path is public.
  return new NextRequest(`https://chumley.app${path}`);
}

const isLoginRedirect = (res: ReturnType<typeof gate>) =>
  res.status >= 300 &&
  res.status < 400 &&
  (res.headers.get("location") ?? "").includes("/login");

describe("gate public allowlist", () => {
  it("lets signed-out visitors reach every public route", () => {
    const publicPaths = [
      "/",
      "/pricing",
      "/privacy",
      "/terms",
      "/refunds",
      "/compare/hubspot",
      "/for/roofers",
      "/guides",
      "/guides/first-lead",
      "/tools",
      "/tools/sales-pipeline-tracker",
      "/api/health",
      "/robots.txt",
      "/sitemap.xml",
      "/llms.txt",
      "/embed.js",
      "/f/9d08c01e-a8f7-4ebb-9bf4-f8f479de33b8",
      "/api/forms/9d08c01e-a8f7-4ebb-9bf4-f8f479de33b8",
      "/api/webhooks/leads/abc",
      "/api/client-error",
      "/uat",
      "/uat/some-token",
      "/api/uat/attachments",
      "/api/auth/callback/google",
      "/join/some-invite",
      "/login",
    ];
    for (const path of publicPaths) {
      expect(isLoginRedirect(gate(reqTo(path)), ), `${path} should be public`).toBe(
        false
      );
    }
  });

  it("redirects signed-out visitors away from private routes", () => {
    for (const path of ["/pipeline", "/contacts", "/settings", "/admin"]) {
      expect(
        isLoginRedirect(gate(reqTo(path))),
        `${path} should be gated`
      ).toBe(true);
    }
  });
});
