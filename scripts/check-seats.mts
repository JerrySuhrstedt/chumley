import { config } from "dotenv";
import postgres from "postgres";
config({ path: ".env.local" });
const { PRICES, priceFor } = await import("../src/lib/paddle/catalog.js");

const sql = postgres(process.env.DATABASE_URL!, { ssl: "require" });
const rows = await sql`
  select o.name, count(distinct m.id)::int as members,
         max(s.quantity) as seats_paid, max(s.status) as status,
         max(s.price_id) as price_id
  from organizations o
  left join memberships m on m.org_id = o.id
  left join subscriptions s on s.org_id = o.id
  group by o.id, o.name order by o.name`;

const YEARLY = [PRICES.solo.yearly, PRICES.team["3to4"].yearly,
                PRICES.team["5to9"].yearly, PRICES.team["10plus"].yearly];

for (const r of rows) {
  if (!r.status) { console.log(`${String(r.name).padEnd(22)} members=${r.members}  (no subscription, ungated)`); continue; }
  const notes: string[] = [];
  if (r.members > r.seats_paid) notes.push("OVER SEATS, invites blocked");
  // A team on the wrong rung of the volume ladder is overpaying.
  const want = priceFor(r.seats_paid, YEARLY.includes(r.price_id));
  if (r.status === "active" && want !== r.price_id) notes.push("WRONG TIER PRICE, overpaying");
  if (r.status === "trialing" && want !== r.price_id) notes.push("tier corrects at trial end");
  console.log(`${String(r.name).padEnd(22)} members=${r.members}  paid=${r.seats_paid}  ${r.status}${notes.length ? "  <-- " + notes.join("; ") : ""}`);
}
await sql.end();
