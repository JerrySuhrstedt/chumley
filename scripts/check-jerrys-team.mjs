import { config } from "dotenv";
import postgres from "postgres";
config({ path: ".env.local" });
const sql = postgres(process.env.DATABASE_URL, { prepare: false, connect_timeout: 10 });
const orgs = await sql`
  SELECT o.id, o.name,
    (SELECT count(*)::int FROM leads l WHERE l.org_id = o.id AND l.is_sample) AS samples,
    (SELECT count(*)::int FROM leads l WHERE l.org_id = o.id AND NOT l.is_sample) AS real
  FROM organizations o ORDER BY o.created_at DESC`;
for (const r of orgs) console.log(`${r.name.padEnd(22)} samples:${r.samples} real:${r.real}`);
const leads = await sql`
  SELECT l.name, l.is_sample, l.stage, l.created_at, o.name AS org
  FROM leads l JOIN organizations o ON o.id = l.org_id
  WHERE o.name ILIKE '%jerry%' ORDER BY l.created_at`;
console.log("--- leads on Jerry-ish teams:");
for (const r of leads) console.log(r.is_sample ? "SAMPLE" : "REAL  ", "|", r.name, "|", r.stage, "|", String(r.created_at).slice(0, 24));
await sql.end();
