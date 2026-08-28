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

export default async function UatPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  // ?preview opens the checklist read-through for the owner: intro
  // skipped, nothing saved, nothing sendable. Harmless if a tester finds
  // it; they would only be looking at the same list with no Send button.
  const preview = (await searchParams).preview !== undefined;
  return <UatClient preview={preview} />;
}
