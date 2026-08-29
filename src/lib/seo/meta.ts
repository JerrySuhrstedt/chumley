import type { Metadata } from "next";
import { SITE_URL } from "./facts";

/**
 * One helper so every marketing page ships a title, a description, a
 * canonical URL, and Open Graph and Twitter cards without repeating the
 * boilerplate. The canonical matters most: it tells search engines which URL
 * is the real one, so a page reached with a tracking parameter does not get
 * treated as a duplicate.
 */
export function pageMeta({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = `${SITE_URL}${path}`;
  const fullTitle = `${title} | Chumley`;
  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: "Chumley",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
  };
}
