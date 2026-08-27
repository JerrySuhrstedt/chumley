import type { MetadataRoute } from "next";

/** The public pages, which is to say the marketing site. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://chumley.app";
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/pricing`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/refunds`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
