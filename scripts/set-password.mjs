import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("usage: node scripts/set-password.mjs <email> <password>");
  process.exit(1);
}

// pgcrypto lives in the `extensions` schema on Supabase.
const [user] = await sql`
  UPDATE auth.users
  SET encrypted_password = extensions.crypt(${password}, extensions.gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now()
  WHERE email = ${email}
  RETURNING id, email, email_confirmed_at
`;

if (!user) {
  console.error(`No auth.users row found for ${email}`);
  process.exit(1);
}

console.log("updated:", user);
await sql.end();
