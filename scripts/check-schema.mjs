import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

const cols = await sql`
  SELECT column_name, data_type, column_default
  FROM information_schema.columns
  WHERE table_name = 'leads' AND table_schema = 'public'
  ORDER BY ordinal_position
`;

console.table(cols.map((c) => ({ ...c })));
await sql.end();
