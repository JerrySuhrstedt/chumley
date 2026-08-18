import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

const cols = await sql`
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'memberships' AND table_schema = 'public'
  ORDER BY ordinal_position
`;

console.log(cols.map((c) => c.column_name).join(", "));
await sql.end();
