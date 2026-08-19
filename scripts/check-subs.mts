import { config } from "dotenv";
import postgres from "postgres";
config({ path: ".env.local" });
const sql = postgres(process.env.DATABASE_URL!, { ssl: "require" });
const rows = await sql`
  select s.id, s.status, s.quantity, s.price_id, s.customer_id,
         s.trial_ends_at, s.current_period_end, s.scheduled_change_action,
         s.created_at, o.name as org
  from subscriptions s join organizations o on o.id = s.org_id
  order by s.created_at desc limit 10`;
console.log(rows.length ? rows : "NO SUBSCRIPTION ROWS YET");
await sql.end();
