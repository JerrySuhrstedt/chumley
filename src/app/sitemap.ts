import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/facts";
import { PUBLIC_ROUTES } from "@/lib/seo/routes";

/** The public pages, generated from the one route registry. */
export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path === "/" ? "" : r.path}`,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
