/**
 * LinkedIn profile URL handling.
 *
 * Note on headshots: LinkedIn does not allow a profile photo to be fetched
 * from a public profile URL. Profile data sits behind authentication and
 * automated fetching is blocked, so the only sanctioned way to get somebody's
 * own picture is to have them sign in with LinkedIn, which returns it in the
 * OpenID Connect `picture` claim. Everything here therefore stores and tidies
 * the URL; it never tries to scrape it.
 */

/** Accepts what people actually paste and returns a canonical profile URL. */
export function normalizeLinkedinUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  // People paste bare handles, bare domains, and full URLs with tracking junk.
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host !== "linkedin.com" && !host.endsWith(".linkedin.com")) {
    return null;
  }

  // /in/<handle> is a person; /company/<handle> is a business page.
  const match = url.pathname.match(/^\/(in|pub)\/([^/]+)/i);
  if (!match) return null;

  const handle = decodeURIComponent(match[2]).replace(/\/+$/, "");
  if (!handle) return null;

  return `https://www.linkedin.com/in/${handle}`;
}

/** The handle alone, for showing a short version in the UI. */
export function linkedinHandle(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/\/in\/([^/?#]+)/);
  return match ? match[1] : null;
}
