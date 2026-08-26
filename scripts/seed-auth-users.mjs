/**
 * Task 3 of the migration: every Supabase user becomes a Better Auth
 * user with the SAME uuid, which is what spares memberships and every
 * org relationship from a remap. Names come from the OAuth metadata
 * where present, the email prefix otherwise. Re-runnable: upserts.
 */
import { readFileSync } from "fs";
import postgres from "postgres";
const url = readFileSync("/private/tmp/claude-501/-Users-jerry/7ac419d5-7424-4b07-9970-4804b23f2a24/scratchpad/neon-url.txt", "utf8").trim();
const sql = postgres(url, { max: 1, connect_timeout: 10 });

const src = await sql`
  SELECT id, email, created_at, raw_user_meta_data AS meta
  FROM auth.users WHERE email IS NOT NULL`;

for (const u of src) {
  const meta = u.meta ?? {};
  const name =
    meta.full_name ?? meta.name ?? String(u.email).split("@")[0];
  const image = meta.avatar_url ?? meta.picture ?? null;
  // A UAT login may have minted this email under a random id before the
  // real Supabase user existed. The Supabase id is the one memberships
  // point at, so the impostor row goes; its sessions cascade away.
  await sql`DELETE FROM users
    WHERE lower(email) = ${String(u.email).toLowerCase()} AND id <> ${u.id}`;
  await sql`
    INSERT INTO users (id, name, email, email_verified, image, created_at, updated_at)
    VALUES (${u.id}, ${name}, ${String(u.email).toLowerCase()}, true, ${image}, ${u.created_at}, now())
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name, email = EXCLUDED.email, image = EXCLUDED.image`;
}

const check = await sql`
  SELECT u.email, u.name,
         (SELECT o.name FROM memberships m JOIN organizations o ON o.id = m.org_id
           WHERE m.user_id = u.id LIMIT 1) AS team
  FROM users u ORDER BY u.created_at`;
for (const r of check) console.log(`${String(r.email).padEnd(36)} ${String(r.name).padEnd(20)} -> ${r.team ?? "(no team)"}`);
console.log(`${check.length} users seeded`);
await sql.end();
