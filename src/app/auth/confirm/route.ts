import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

/**
 * Where Supabase-era email links used to land.
 *
 * Auth moved to Better Auth on 08-26-2026 and its links verify on
 * /api/auth/* instead. This route stays so a link in an old email fails
 * politely at the login screen rather than as a 404.
 */
export function GET(request: NextRequest) {
  const next = new URL(request.url).searchParams.get("next") ?? "/pipeline";
  redirect(`/login?next=${encodeURIComponent(next)}`);
}
