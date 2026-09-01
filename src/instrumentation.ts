import { reportError } from "@/lib/report-error";

/**
 * A boot-time check that the columns the app reads actually exist. The
 * database was migrated by hand for months, so a rebuilt environment
 * could come up missing a column and fail asymmetrically: a missing
 * notify column just stops notifications, but a column selected by
 * getCurrentOrg's `with: { org: true }` 500s every authenticated page.
 * This runs once per cold start and shouts if anything the app depends
 * on is absent. Loud, never fatal: a boot crash on a live CRM is a
 * worse outage than the drift it would be reporting.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { db } = await import("@/db");
    const { sql } = await import("drizzle-orm");

    const required: [string, string][] = [
      ["organizations", "notify_new_leads"],
      ["lead_notice_log", "org_id"],
      ["uat_testers", "focus"],
      ["backlog_items", "attachments"],
      ["uat_attachments", "data"],
    ];

    const rows = (await db.execute(sql`
      SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema = 'public'
    `)) as unknown as { table_name: string; column_name: string }[];

    const have = new Set(rows.map((r) => `${r.table_name}.${r.column_name}`));
    const missing = required.filter(([t, c]) => !have.has(`${t}.${c}`));
    if (missing.length > 0) {
      console.error(
        "[schema] missing, run db:migrate:",
        missing.map((m) => m.join(".")).join(", ")
      );
    }
  } catch (e) {
    console.error("[schema] boot check could not run", e);
  }
}

/**
 * Next calls this for every unhandled error on the server: pages, route
 * handlers and server actions alike. One hook rather than a try/catch in
 * every action, which is the version that gets forgotten in the file
 * somebody writes next week.
 */
export function onRequestError(
  error: unknown,
  request: { path?: string; method?: string },
  context: { routerKind?: string; routePath?: string; renderSource?: string }
): void {
  reportError(error, context.routePath ?? request.path ?? "unknown", {
    method: request.method,
    path: request.path,
    source: context.renderSource ?? context.routerKind,
  });
}
