import type { MetadataRoute } from "next";

/**
 * What crawlers may index: the marketing site, and nothing behind login.
 * The app routes 307 to /login anyway, but telling crawlers not to
 * bother beats letting them pile up soft-404s.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/pipeline", "/dashboard", "/contacts", "/calendar", "/settings", "/admin", "/login", "/api/", "/join/", "/f/"],
    },
    sitemap: "https://chumley.app/sitemap.xml",
  };
}
