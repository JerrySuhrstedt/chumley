import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Cap on unauthenticated lead creation, per team, per hour.
 *
 * The public form and the Zapier webhook stand between the open internet
 * and an insert, guarded by a token and a honeypot. This is the third
 * guard: a flood that gets past both cannot bury a team's board or grow
 * the table without limit. Sixty an hour is roughly one a minute, far
 * beyond any real team's inbound rate and far below a script's.
 */
const HOURLY_CAP = 60;

export async function overIngestCap(orgId: string): Promise<boolean> {
  const rows = (await db.execute(sql`
    SELECT count(*)::int AS n FROM leads
    WHERE org_id = ${orgId}::uuid
      AND created_at > now() - interval '1 hour'
  `)) as unknown as { n: number }[];
  return Number(rows[0]?.n ?? 0) >= HOURLY_CAP;
}
