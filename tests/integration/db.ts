import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

/**
 * The connection integration tests are allowed to use, and only that one.
 *
 * These tests create and delete rows. Pointing them at production would be
 * one typo away from deleting a customer's pipeline, so the rule is
 * enforced in code rather than written in a comment asking people to be
 * careful: an explicit TEST_DATABASE_URL, and a hard refusal if it happens
 * to be the same database the app runs on.
 *
 * Without it the integration suites skip. Skipped is honest. Quietly
 * passing because nothing ran is how a suite starts lying.
 */
const testUrl = process.env.TEST_DATABASE_URL?.trim();
const appUrl = process.env.DATABASE_URL?.trim();

export const dbConfigured = Boolean(testUrl);

if (testUrl) {
  const strip = (u: string) => u.split("?")[0].replace(/\/+$/, "");
  // The fixtures below (withOrg, sql) write and delete rows through
  // TEST_DATABASE_URL, but the code under test imports @/db, which connects
  // through DATABASE_URL. If the two name different databases the fixtures
  // land in one database while the code reads and writes another: the tests
  // assert against nothing, and whatever DATABASE_URL points at, production
  // included, is what actually gets touched. The only safe configuration is
  // both variables naming the SAME scratch database, so anything else is a
  // hard stop rather than a silent split-brain. Point BOTH at the scratch DB.
  if (!appUrl || strip(testUrl) !== strip(appUrl)) {
    throw new Error(
      "TEST_DATABASE_URL is set but DATABASE_URL does not point at the same " +
        "database. Integration tests write fixtures via TEST_DATABASE_URL and " +
        "the code under test reads via DATABASE_URL (@/db), so both must name " +
        "the same scratch database. Set DATABASE_URL to the scratch DB too."
    );
  }
}

export const sql = testUrl ? postgres(testUrl, { max: 1 }) : null;

/** A throwaway team, removed however the test ends. */
export async function withOrg<T>(
  name: string,
  fn: (orgId: string) => Promise<T>
): Promise<T> {
  if (!sql) throw new Error("No test database configured.");
  const [org] = await sql`
    INSERT INTO organizations (name) VALUES (${`ZZZ test ${name}`})
    RETURNING id`;
  const orgId = String(org.id);
  try {
    return await fn(orgId);
  } finally {
    await sql`DELETE FROM activities WHERE org_id = ${orgId}`;
    await sql`DELETE FROM leads WHERE org_id = ${orgId}`;
    await sql`DELETE FROM subscriptions WHERE org_id = ${orgId}`;
    await sql`DELETE FROM memberships WHERE org_id = ${orgId}`;
    await sql`DELETE FROM organizations WHERE id = ${orgId}`;
  }
}
