import { config } from "dotenv";
import postgres from "postgres";
config({ path: ".env.local" });
const sql = postgres(process.env.DATABASE_URL!, { ssl: "require" });
await sql`update auth.users set email_confirmed_at = now(), confirmed_at = now()
          where email = 'walkthrough-aug20@sell1check.dev' and email_confirmed_at is null`
  .catch(async () => {
    // confirmed_at is generated in newer Supabase; set only the email one.
    await sql`update auth.users set email_confirmed_at = now()
              where email = 'walkthrough-aug20@sell1check.dev'`;
  });
const [u] = await sql`select email, email_confirmed_at is not null as confirmed
                      from auth.users where email='walkthrough-aug20@sell1check.dev'`;
console.log(`  ${u.email} confirmed=${u.confirmed}`);
await sql.end();
