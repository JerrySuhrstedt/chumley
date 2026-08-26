import { config } from "dotenv";
import postgres from "postgres";
config({ path: ".env.local" });
const sql = postgres(process.env.DATABASE_URL, { prepare: false, connect_timeout: 10 });
const t = Date.now();
const rows = await sql`
  SELECT state, count(*)::int
  FROM pg_stat_activity
  WHERE datname = current_database()
  GROUP BY state ORDER BY count(*) DESC`;
console.log(`connected in ${Date.now() - t}ms`);
console.table(rows.map(r => ({state: r.state ?? "null", count: r.count})));
const [{count}] = await sql`SELECT count(*)::int FROM pg_stat_activity`;
console.log("total backends:", count);
await sql.end();
