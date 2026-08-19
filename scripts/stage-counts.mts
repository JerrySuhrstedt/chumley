import { config } from "dotenv";
import postgres from "postgres";
config({ path: ".env.local" });
const sql = postgres(process.env.DATABASE_URL!, { ssl: "require" });
console.log(await sql`select stage, count(*)::int from leads group by stage order by 2 desc`);
await sql.end();
