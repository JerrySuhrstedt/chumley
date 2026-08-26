// Temporary: is the direct (non-pooler) connection alive and fast?
import { config } from "dotenv";
import postgres from "postgres";
config({ path: ".env.local" });

const pooled = process.env.DATABASE_URL;
const m = pooled.match(/^postgresql:\/\/postgres\.([^:]+):([^@]+)@[^/]+\/(.+)$/);
if (!m) { console.log("could not parse DATABASE_URL"); process.exit(1); }
const [, ref, pass, db] = m;
const direct = `postgresql://postgres:${pass}@db.${ref}.supabase.co:5432/${db}`;

for (const [label, url, opts] of [
  ["pooler", pooled, { prepare: false }],
  ["direct", direct, { ssl: "require" }],
]) {
  const t = Date.now();
  try {
    const sql = postgres(url, { ...opts, connect_timeout: 10, max: 1 });
    const [{ one }] = await sql`SELECT 1 AS one`;
    console.log(`${label}: OK in ${Date.now() - t}ms`);
    await sql.end();
  } catch (e) {
    console.log(`${label}: FAILED in ${Date.now() - t}ms — ${e.message}`);
  }
}
