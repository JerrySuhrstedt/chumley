import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

// Mirrors normalizePhone() in src/lib/phone.ts.
function normalize(value) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("+")) return trimmed || null;
  const d = trimmed.replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length === 11 && d.startsWith("1")) {
    const r = d.slice(1);
    return `(${r.slice(0, 3)}) ${r.slice(3, 6)}-${r.slice(6)}`;
  }
  return trimmed;
}

const rows = await sql`SELECT id, name, phone FROM leads WHERE phone IS NOT NULL`;
let changed = 0;

for (const row of rows) {
  const next = normalize(row.phone);
  if (next && next !== row.phone) {
    await sql`UPDATE leads SET phone = ${next} WHERE id = ${row.id}`;
    console.log(`${row.name}: ${row.phone} -> ${next}`);
    changed++;
  }
}

console.log(`Reformatted ${changed} of ${rows.length} numbers.`);
await sql.end();
