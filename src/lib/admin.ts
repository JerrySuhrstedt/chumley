import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/org";

/**
 * Who may see the back office.
 *
 * Read from the environment rather than written here, because this repo is
 * public and an access list in source is an invitation. Unset means nobody,
 * never everybody: a missing variable locks the door instead of opening it.
 */
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Whether an email address belongs to a listed administrator.
 *
 * Exists so admin actions can refuse to destroy an administrator's own
 * team: the access list is the closest thing Chumley has to an owner
 * account, so the accounts behind it get the protection.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

export async function isAdmin(): Promise<boolean> {
  const allowed = adminEmails();
  if (allowed.length === 0) return false;

  const user = await getCurrentUser();
  const email = user?.email?.toLowerCase();
  return Boolean(email && allowed.includes(email));
}

/**
 * Gate for every admin page and every admin action.
 *
 * Answers 404 rather than 403, so the back office does not announce that it
 * exists to anyone poking at URLs. Call this at the top of the work, not
 * beside it, so a new page cannot forget.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) notFound();
}
