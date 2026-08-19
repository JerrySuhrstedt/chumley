import { config } from "dotenv";
import postgres from "postgres";
config({ path: ".env.local" });
const sql = postgres(process.env.DATABASE_URL, { prepare: false });

const q = async (label, rows) => console.log(label.padEnd(26), rows[0].count ?? JSON.stringify(rows[0]));

await q("organizations", await sql`select count(*)::int from organizations`);
await q("memberships", await sql`select count(*)::int from memberships`);
await q("org_invites", await sql`select count(*)::int from org_invites`);
await q("leads (total)", await sql`select count(*)::int from leads`);
await q("leads on board", await sql`select count(*)::int from leads where stage <> 'contact'`);
await q("contacts (off board)", await sql`select count(*)::int from leads where stage = 'contact'`);
await q("activities", await sql`select count(*)::int from activities`);
await q("templates", await sql`select count(*)::int from templates`);

console.log("\nleads by stage:");
for (const r of await sql`select stage, count(*)::int from leads group by stage order by 2 desc`)
  console.log("  ", String(r.stage).padEnd(16), r.count);

console.log("\nactivities by type:");
for (const r of await sql`select type, count(*)::int from activities group by type order by 2 desc`)
  console.log("  ", String(r.type).padEnd(16), r.count);

const [org] = await sql`select id, name, webhook_token, stage_labels from organizations limit 1`;
console.log("\norg:", org.name, "| webhook token present:", Boolean(org.webhook_token));
console.log("stage labels:", JSON.stringify(org.stage_labels));
console.log("WEBHOOK_TOKEN=" + org.webhook_token);
await sql.end();
