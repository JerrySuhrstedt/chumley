import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * The team owner's user id, for inbound leads that arrive with no human
 * attached: the public form and the Zapier webhook. Somebody has to work
 * the lead, and the owner is the only safe default.
 */
export async function orgOwnerId(orgId: string): Promise<string | null> {
  const rows = (await db.execute(sql`
    SELECT user_id FROM memberships
    WHERE org_id = ${orgId}::uuid AND role = 'owner'
    ORDER BY created_at LIMIT 1
  `)) as unknown as { user_id: string }[];
  return rows[0]?.user_id ?? null;
}
