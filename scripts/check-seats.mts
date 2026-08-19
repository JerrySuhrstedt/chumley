import { config } from "dotenv";
import postgres from "postgres";
config({ path: ".env.local" });
const sql = postgres(process.env.DATABASE_URL!, { ssl: "require" });
const rows = await sql`
  select o.name, count(m.id)::int as members,
         coalesce(max(s.quantity), 0) as seats_paid,
         max(s.status) as status
  from organizations o
  left join memberships m on m.org_id = o.id
  left join subscriptions s on s.org_id = o.id
  group by o.id, o.name order by o.name`;
for (const r of rows) {
  const gated = r.status ? (r.members > r.seats_paid ? "  <-- OVER SEATS, invites blocked" : "") : "  (no sub, ungated)";
  console.log(`${String(r.name).padEnd(22)} members=${r.members}  paid=${r.seats_paid}  ${r.status ?? "-"}${gated}`);
}
await sql.end();
