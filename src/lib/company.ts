/**
 * Consumer mailbox providers. A lead at one of these tells us nothing about
 * their company, so we don't try to derive a logo from it.
 */
const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "ymail.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "protonmail.com",
  "proton.me",
  "gmx.com",
  "zoho.com",
  "comcast.net",
  "sbcglobal.net",
  "cox.net",
  "verizon.net",
]);

/** Best-guess company domain from a work email address. */
export function companyDomainFromEmail(
  email: string | null | undefined
): string | null {
  if (!email) return null;

  const at = email.lastIndexOf("@");
  if (at === -1) return null;

  const domain = email.slice(at + 1).trim().toLowerCase();
  if (!domain.includes(".") || domain.endsWith(".")) return null;
  if (PERSONAL_EMAIL_DOMAINS.has(domain)) return null;

  return domain;
}

/**
 * Routed through our own proxy so a domain with no logo returns a real 404
 * (the upstream service serves a generic globe instead) and so the lookup
 * happens server-side rather than from the rep's browser.
 */
export function companyLogoUrl(domain: string): string {
  return `/api/logo?domain=${encodeURIComponent(domain)}`;
}
