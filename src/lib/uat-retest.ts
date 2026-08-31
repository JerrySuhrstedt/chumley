import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Working out who is worth asking back, and for what.
 *
 * The obvious trigger is "they submitted, so send them round two". That is
 * wrong, and we have the evidence: Joudi's second run included CL-1 and
 * CL-2 while both were still open, so she re-reported bugs nobody had
 * touched and two backlog items arrived as duplicates of two others.
 *
 * A retest is only worth a tester's evening once the things they found have
 * actually been fixed. So the trigger is a backlog item from their own
 * report reaching `done`, not the report arriving.
 *
 * `retest_at` on the tester is the line between "already asked" and "fixed
 * since then", so a check cannot come round again once they have re-run it.
 */

export type RetestReadiness = {
  testerId: string;
  /** Check ids fixed since their last retest, oldest fix first. */
  checkIds: string[];
  /** Fixed items still waiting to be sent. */
  readyCount: number;
  /** Reported by them and not yet fixed. Not sent, but worth seeing. */
  openCount: number;
};

/**
 * Per tester, what is fixed and waiting versus what is still open.
 *
 * Keyed on tester_id rather than the name typed into the form, because a
 * tester can rename themselves between runs and a name match would either
 * miss their history or collide with somebody else's.
 */
export async function getRetestReadiness(): Promise<
  Map<string, RetestReadiness>
> {
  const rows = (await db.execute(sql`
    SELECT
      t.id AS tester_id,
      COALESCE(
        array_agg(DISTINCT b.check_id)
          FILTER (WHERE b.status = 'done'
                    AND b.updated_at > COALESCE(t.retest_at, 'epoch'::timestamptz)
                    /* A check is only ready when nothing about it is still
                       open. The same check id can carry several items across
                       rounds, and one of them being fixed says nothing about
                       the others. Without this, closing a round-one item put
                       the check back in a retest while a round-two report of
                       the same thing sat untouched, which is precisely the
                       duplicate-report loop this was built to end. */
                    AND NOT EXISTS (
                      SELECT 1 FROM uat_reports r2
                        JOIN backlog_items b2 ON b2.report_id = r2.id
                       WHERE r2.tester_id = t.id
                         AND b2.check_id = b.check_id
                         AND b2.status <> 'done'
                    )),
        '{}'
      ) AS ready_checks,
      count(*) FILTER (WHERE b.status <> 'done')::int AS open_count
    FROM uat_testers t
    JOIN uat_reports r ON r.tester_id = t.id
    JOIN backlog_items b ON b.report_id = r.id
    GROUP BY t.id
  `)) as unknown as {
    tester_id: string;
    ready_checks: string[];
    open_count: number;
  }[];

  const out = new Map<string, RetestReadiness>();
  for (const r of rows) {
    const checkIds = (r.ready_checks ?? []).filter(Boolean);
    out.set(r.tester_id, {
      testerId: r.tester_id,
      checkIds,
      readyCount: checkIds.length,
      openCount: Number(r.open_count ?? 0),
    });
  }
  return out;
}
