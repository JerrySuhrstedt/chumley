import type { MetadataRoute } from "next";

/**
 * What crawlers may index: the marketing site, and nothing behind login.
 * The app routes 307 to /login anyway, but telling crawlers not to bother
 * beats letting them pile up soft-404s.
 *
 * The AI crawlers (GPTBot, ClaudeBot, Google-Extended, PerplexityBot,
 * OAI-SearchBot and the rest) are welcomed by the same allow-all rule on
 * purpose. For a product that wants to be recommended inside an AI answer,
 * being crawlable is being citable; blocking them would keep Chumley out of
 * exactly the answers we want to appear in.
 */
const OFF_LIMITS = [
  "/pipeline",
  "/dashboard",
  "/contacts",
  "/calendar",
  "/settings",
  "/admin",
  "/login",
  "/api/",
  "/join/",
  "/f/",
  "/uat",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: OFF_LIMITS },
    sitemap: "https://chumley.app/sitemap.xml",
    host: "https://chumley.app",
  };
}
