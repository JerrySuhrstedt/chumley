import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
const sql = postgres(process.env.DATABASE_URL, { prepare: false });

const users = await sql`
  SELECT id, email, raw_app_meta_data->>'provider' AS last_provider,
         raw_app_meta_data->'providers' AS all_providers,
         raw_user_meta_data->>'avatar_url' AS avatar,
         last_sign_in_at
  FROM auth.users ORDER BY created_at
`;

for (const u of users) {
  console.log("user:          ", u.email);
  console.log("  last provider:", u.last_provider);
  console.log("  all providers:", JSON.stringify(u.all_providers));
  console.log("  avatar host:  ", u.avatar ? new URL(u.avatar).host : "(none)");
  console.log("  last sign in: ", u.last_sign_in_at);

  const ids = await sql`
    SELECT provider, last_sign_in_at, created_at
    FROM auth.identities WHERE user_id = ${u.id} ORDER BY created_at
  `;
  for (const i of ids) {
    console.log(`  · ${i.provider.padEnd(14)} linked ${i.created_at.toISOString().slice(0,16)}  last used ${i.last_sign_in_at?.toISOString().slice(0,16) ?? "never"}`);
  }
  console.log();
}
await sql.end();
