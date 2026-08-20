import { config } from "dotenv";
import postgres from "postgres";
config({ path: ".env.local" });
const sql = postgres(process.env.DATABASE_URL!, { ssl: "require" });

const rows = await sql`
  select o.name,
    (select count(*) from leads l where l.org_id=o.id and l.is_sample)::int as samples,
    (select count(*) from leads l where l.org_id=o.id and not l.is_sample and l.stage!='contact')::int as real_deals,
    (select count(*) from activities a where a.org_id=o.id and a.type='stage_change')::int as moves,
    (select count(*) from activities a where a.org_id=o.id and a.type in ('call','text','email'))::int as contacts,
    (select count(*) from leads l where l.org_id=o.id and l.next_action_text is not null and not l.is_sample)::int as next_steps,
    o.created_at::date as joined
  from organizations o order by o.created_at`;

console.log("team                samples  real  moves  contacts  next-steps  joined");
for (const r of rows) {
  console.log(
    `${String(r.name).padEnd(20)} ${String(r.samples).padStart(5)} ${String(r.real_deals).padStart(6)} ${String(r.moves).padStart(6)} ${String(r.contacts).padStart(9)} ${String(r.next_steps).padStart(11)}  ${r.joined}`
  );
}
const n = rows.length;
const pct = (k: string) => Math.round(rows.filter(r => Number(r[k]) > 0).length / n * 100);
console.log(`\nof ${n} teams: ${pct("real_deals")}% added a real deal, ${pct("moves")}% moved one, ${pct("contacts")}% ever tapped call/text/email`);
await sql.end();
