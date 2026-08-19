import { config } from "dotenv";
import postgres from "postgres";
config({ path: ".env.local" });
const sql = postgres(process.env.DATABASE_URL!, { ssl: "require" });
console.log("stage column type:", (await sql`
  select data_type from information_schema.columns
  where table_name='leads' and column_name='stage'`)[0].data_type);
console.log("leads by stage:", await sql`select stage, count(*)::int from leads group by stage order by 2 desc`);
console.log("stages rows:", (await sql`select count(*)::int from stages`)[0].count);
await sql.end();
