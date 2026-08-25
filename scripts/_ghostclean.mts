import { config } from "dotenv";
config({ path: ".env.local" });
import postgres from "postgres";
import { Environment, Paddle } from "@paddle/paddle-node-sdk";

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: Environment.production,
});
const { getBillingState } = await import("../src/lib/paddle/access.ts");

const rows = await sql`
  SELECT s.id, s.status, s.org_id, o.name FROM subscriptions s
  JOIN organizations o ON o.id = s.org_id`;

console.log(`${rows.length} subscription row(s) mirrored locally.\n`);

for (const r of rows) {
  const id = String(r.id);
  let existsLive = true;
  try {
    const live = await paddle.subscriptions.get(id);
    console.log(`KEEP  ${id}  exists in live Paddle (${live.status}) — not touching it`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!/not found/i.test(msg)) {
      console.log(`SKIP  ${id}  Paddle errored for another reason: ${msg}`);
      continue;
    }
    existsLive = false;
  }
  if (existsLive) continue;

  const before = await getBillingState(String(r.org_id));
  await sql`DELETE FROM subscriptions WHERE id = ${id}`;
  const after = await getBillingState(String(r.org_id));

  console.log(`DELETED ${id}  ("${r.name}") — absent from live Paddle`);
  console.log(`  before: active=${before.active} readOnly=${before.readOnly} inTrial=${before.inTrial}`);
  console.log(`  after:  active=${after.active} readOnly=${after.readOnly} inTrial=${after.inTrial}` +
    (after.trialEndsAt ? ` trialEnds=${after.trialEndsAt.toDateString()}` : ""));
  if (after.readOnly && !before.readOnly) {
    console.log("  ⚠️  This LOCKED THEM OUT. Investigate.");
  } else {
    console.log("  no loss of access.");
  }
}

const left = await sql`SELECT count(*)::int AS n FROM subscriptions`;
console.log(`\nsubscription rows remaining: ${left[0].n}`);
await sql.end();
