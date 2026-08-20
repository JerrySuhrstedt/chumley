import { config } from "dotenv";
import postgres from "postgres";
config({ path: ".env.local" });
const sql = postgres(process.env.DATABASE_URL!, { ssl: "require" });

console.log("--- leads whose bucket does not exist for their team ---");
const orphans = await sql`
  select o.name as org, l.stage, count(*)::int as n
  from leads l
  join organizations o on o.id = l.org_id
  where exists (select 1 from stages s where s.org_id = l.org_id)
    and not exists (select 1 from stages s where s.org_id = l.org_id and s.key = l.stage)
  group by o.name, l.stage order by n desc`;
console.log(orphans.length ? orphans : "  none");

console.log("\n--- teams with leads but no stages seeded yet ---");
const unseeded = await sql`
  select o.name, count(l.id)::int as leads
  from organizations o
  left join leads l on l.org_id = o.id
  where not exists (select 1 from stages s where s.org_id = o.id)
  group by o.name`;
console.log(unseeded.length ? unseeded : "  none");

console.log("\n--- teams missing a won, lost or contact bucket ---");
const broken = await sql`
  select o.name,
    count(*) filter (where s.kind='won')::int as won,
    count(*) filter (where s.kind='lost')::int as lost,
    count(*) filter (where s.kind='contact')::int as contact,
    count(*) filter (where s.kind='open')::int as open
  from organizations o join stages s on s.org_id=o.id
  group by o.name`;
for (const r of broken) {
  const bad = r.won !== 1 || r.lost !== 1 || r.contact !== 1 || r.open < 1;
  console.log(`  ${String(r.name).padEnd(18)} open=${r.open} won=${r.won} lost=${r.lost} contact=${r.contact}${bad ? "  <-- BROKEN" : ""}`);
}

console.log("\n--- duplicate positions among open buckets ---");
const dupes = await sql`
  select o.name, s.position, count(*)::int as n
  from stages s join organizations o on o.id=s.org_id
  where s.kind='open' group by o.name, s.position having count(*) > 1`;
console.log(dupes.length ? dupes : "  none");
await sql.end();
