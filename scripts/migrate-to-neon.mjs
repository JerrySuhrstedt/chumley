/**
 * Copy every row from the Supabase database into Neon.
 *
 * One-way, re-runnable: targets are emptied first, so running it again
 * just refreshes the copy. Supabase stays the live source of truth; this
 * script never writes to it.
 *
 * auth.users and auth.identities are copied as plain tables (only the
 * columns the app reads), so the admin queries keep working on Neon
 * before Better Auth replaces them.
 */
import { config } from "dotenv";
import { readFileSync } from "fs";
import postgres from "postgres";
config({ path: ".env.local" });

const NEON_URL_FILE = "/private/tmp/claude-501/-Users-jerry/7ac419d5-7424-4b07-9970-4804b23f2a24/scratchpad/neon-url.txt";
const src = postgres(process.env.DATABASE_URL, { prepare: false, connect_timeout: 10, max: 2 });
const dst = postgres(readFileSync(NEON_URL_FILE, "utf8").trim(), { connect_timeout: 10, max: 2 });

// Parents before children, matching the FK graph in src/db/schema.ts.
const TABLES = [
  "organizations", "stages", "memberships", "org_invites", "leads",
  "templates", "activities", "subscriptions", "problem_reports", "alert_log",
];

// The auth shim: plain tables carrying what the app actually reads.
await dst`CREATE SCHEMA IF NOT EXISTS auth`;
await dst`CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  raw_user_meta_data jsonb
)`;
await dst`CREATE TABLE IF NOT EXISTS auth.identities (
  id uuid,
  user_id uuid,
  provider text,
  created_at timestamptz
)`;

async function copy(schema, table, columns) {
  const cols = columns ? dst(columns) : dst`*`;
  const rows = columns
    ? await src`SELECT ${src(columns)} FROM ${src(schema + "." + table)}`
    : await src`SELECT * FROM ${src(schema + "." + table)}`;
  await dst`DELETE FROM ${dst(schema + "." + table)}`;
  if (rows.length) {
    // Chunked so a big activities table cannot build one giant statement.
    for (let i = 0; i < rows.length; i += 200) {
      await dst`INSERT INTO ${dst(schema + "." + table)} ${dst(rows.slice(i, i + 200))}`;
    }
  }
  const [{ n }] = await dst`SELECT count(*)::int AS n FROM ${dst(schema + "." + table)}`;
  const ok = n === rows.length ? "ok" : "MISMATCH";
  console.log(`${(schema + "." + table).padEnd(24)} ${String(rows.length).padStart(5)} rows  ${ok}`);
  if (n !== rows.length) process.exitCode = 1;
}

await copy("auth", "users", ["id", "email", "created_at", "last_sign_in_at", "raw_user_meta_data"]);
await copy("auth", "identities", ["id", "user_id", "provider", "created_at"]);
// Children cleared before parents so FK deletes never block the refresh.
for (const t of [...TABLES].reverse()) await dst`DELETE FROM ${dst("public." + t)}`;
for (const t of TABLES) await copy("public", t);

await src.end();
await dst.end();
console.log("done");
