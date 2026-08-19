import { config } from "dotenv";
import postgres from "postgres";
config({ path: ".env.local" });
const sql = postgres(process.env.DATABASE_URL!, { ssl: "require" });
const rows = await sql`
  select o.name as org, s.key, s.label, s.kind, s.position
  from stages s join organizations o on o.id = s.org_id
  order by o.name, s.kind, s.position`;
if (!rows.length) console.log("no stages seeded yet (seeds on first board read)");
for (const r of rows) console.log(`${String(r.org).padEnd(16)} ${String(r.position)} ${String(r.kind).padEnd(8)} ${r.key.padEnd(16)} ${r.label}`);
await sql.end();
