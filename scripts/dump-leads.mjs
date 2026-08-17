import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

const rows = await sql`
  SELECT name, stage, position
  FROM leads
  ORDER BY stage, position, created_at
`;

console.table(rows.map((r) => ({ ...r })));
await sql.end();
