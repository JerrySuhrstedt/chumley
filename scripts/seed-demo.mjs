import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

/**
 * This inserts fake leads into the first org of whatever DATABASE_URL
 * resolves to, and .env.local normally holds production. Seeding demo data
 * into a customer's pipeline is the kind of mistake you only notice later,
 * so the run is refused against anything that looks like a real database
 * unless you say you mean it with --production (or --force).
 *
 * "Looks real" is defined by exclusion: localhost and 127.0.0.1 are dev, and
 * a host that names itself test/scratch/staging/dev/branch is a scratch
 * database. Everything else is treated as production and stopped. Set
 * PRODUCTION_DB_HOST to name your prod host explicitly if you want a
 * positive match instead.
 */
const FORCE =
  process.argv.includes("--production") || process.argv.includes("--force");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const host = new URL(process.env.DATABASE_URL).hostname;
const isLocal = host === "localhost" || host === "127.0.0.1";
const namedProd =
  process.env.PRODUCTION_DB_HOST && host === process.env.PRODUCTION_DB_HOST;
const looksScratch = /test|scratch|staging|dev|branch/i.test(host);
const looksProd = namedProd || (!isLocal && !looksScratch);

if (looksProd && !FORCE) {
  console.error(
    `Refusing to seed demo leads: DATABASE_URL host "${host}" looks like ` +
      `production. This inserts fake leads into a real org. If you really ` +
      `mean this database, re-run with --production (or --force).`
  );
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

const [org] = await sql`SELECT id FROM organizations ORDER BY created_at LIMIT 1`;
if (!org) {
  console.error("No organization found.");
  process.exit(1);
}

const today = new Date();
const iso = (offsetDays) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

const demo = [
  ["Maria Alvarez", "Alvarez Plumbing", "maria@alvarezplumbing.com", "6025550118", "8500", "new_lead", "Call to introduce", iso(0)],
  ["Tom Brennan", "Brennan HVAC", "tom@brennanhvac.com", "4805550142", "12000", "new_lead", "Send intro email", iso(2)],
  ["Priya Raman", "Sunline Electric", "priya@sunline.com", "6025550177", "22000", "contacted", "Follow up on pricing", iso(-1)],
  ["Chris Doyle", "Doyle Roofing", "chris@doyleroofing.com", "4805550193", "31000", "proposal_sent", "Check proposal status", iso(0)],
  ["Angela Woods", "Woods Landscaping", "angela@woodsland.com", "6025550166", "9500", "proposal_sent", null, null],
  ["Ben Ortiz", "Ortiz Concrete", "ben@ortizconcrete.com", "4805550154", "47000", "won", null, null],
  ["Dana Fletcher", "Fletcher Interiors", "dana@fletcherint.com", "6025550129", "15000", "lost", null, null],
];

for (const [name, company, email, phone, value, stage, action, due] of demo) {
  await sql`
    INSERT INTO leads (org_id, name, company_name, email, phone, value, stage, next_action_text, next_action_due)
    VALUES (${org.id}, ${name}, ${company}, ${email}, ${phone}, ${value}, ${stage}::lead_stage, ${action}, ${due}::date)
  `;
}

console.log(`Inserted ${demo.length} demo leads into org ${org.id}`);
await sql.end();
