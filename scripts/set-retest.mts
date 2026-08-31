/**
 * Point a tester's link at a retest round.
 *
 *   npx tsx scripts/set-retest.mts <token-or-email> FR-2 EL-1 ...   assign
 *   npx tsx scripts/set-retest.mts <token-or-email> clear           full list
 *
 * Assigning sets the focus list, bumps the round (which keys the
 * browser-side draft, so round two starts blank), and clears the server
 * draft so the previous round's write-ups cannot resubmit as duplicates.
 * The tester keeps the same URL; the page does the narrowing.
 */
import postgres from "postgres";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

const [who, ...rest] = process.argv.slice(2);
if (!who || rest.length === 0) {
  console.error(
    "Usage: npx tsx scripts/set-retest.mts <token-or-email> <CHECK-IDS... | clear>"
  );
  process.exit(1);
}

const [tester] = await sql`
  SELECT id, token, name, round FROM uat_testers
  WHERE token = ${who} OR lower(email) = ${who.toLowerCase()}
  LIMIT 1`;
if (!tester) {
  console.error(`No tester found for "${who}".`);
  process.exit(1);
}

if (rest.length === 1 && rest[0] === "clear") {
  await sql`
    UPDATE uat_testers SET focus = NULL, round = round + 1, draft = NULL
    WHERE id = ${tester.id}`;
  console.log(`${tester.name}: back to the full punch list, draft cleared.`);
} else {
  const bad = rest.filter((c) => !/^[A-Z]{2}-\d{1,2}$/.test(c));
  if (bad.length > 0) {
    console.error(`These do not look like check ids: ${bad.join(", ")}`);
    process.exit(1);
  }
  await sql`
    UPDATE uat_testers
    SET focus = ${sql.json(rest)}, round = round + 1, draft = NULL
    WHERE id = ${tester.id}`;
  console.log(
    `${tester.name}: retest round ${Number(tester.round) + 1}, ${rest.length} checks (${rest.join(", ")}). Same link: /uat/${tester.token}`
  );
}

await sql.end();
