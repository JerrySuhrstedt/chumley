import type { Metadata } from "next";
import { UatClient } from "./uat-client";

/**
 * The hidden tester page. Reachable without a session (see auth-gate),
 * unlisted everywhere, and told to search engines twice: noindex here and
 * a disallow in robots.ts. "Hidden" means unlinked, not secret; nothing on
 * this page or in what it stores is sensitive.
 */
export const metadata: Metadata = {
  title: "Tester punch list | Chumley",
  robots: { index: false, follow: false },
};

export default function UatPage() {
  return <UatClient />;
}
