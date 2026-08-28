/**
 * Prints the approved backlog as a work order for a Claude Code session.
 *
 *   npx tsx scripts/backlog-work.mts            approved items (the default)
 *   npx tsx scripts/backlog-work.mts new        items still awaiting review
 *   npx tsx scripts/backlog-work.mts done <id>  mark one item done after it ships
 *
 * This is the handoff point of the two-step UAT loop: the owner approves
 * items in /admin, a session runs this to see exactly what was approved,
 * fixes them, and marks them done once they ship.
 */
import postgres from "postgres";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

const [mode = "approved", id] = process.argv.slice(2);

if (mode === "done") {
  if (!id) {
    console.error("Usage: npx tsx scripts/backlog-work.mts done <id>");
    process.exit(1);
  }
  const rows = await sql`
    UPDATE backlog_items SET status = 'done', updated_at = now()
    WHERE id = ${id} RETURNING id`;
  console.log(rows.length ? `Marked done: ${id}` : `No item with id ${id}`);
} else {
  const status = mode === "new" ? "new" : "approved";
  const items = await sql`
    SELECT id, seq, check_id, tester_name, severity, note, scope, scope_status,
           created_at
    FROM backlog_items
    WHERE status = ${status}
    ORDER BY seq`;

  if (items.length === 0) {
    console.log(`Nothing with status "${status}".`);
  }
  for (const i of items) {
    const s = i.scope;
    const parts = i.tester_name.trim().split(/\s+/);
    const ref = `${((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts.at(-1)[0] : "")).toUpperCase() || "T"}-${i.seq}`;
    console.log(`## ${ref} · ${s?.summary ?? i.check_id}  [${i.id}]`);
    console.log(`check: ${i.check_id} · tester: ${i.tester_name}` +
      (i.severity ? ` · severity: ${i.severity}` : ""));
    console.log(`tester's note: ${i.note}`);
    if (s) {
      console.log(`likely cause: ${s.likelyCause}`);
      console.log(`proposed fix: ${s.proposedFix}`);
      console.log(`size: ${s.size} · files: ${s.files.join(", ") || "none named"}`);
      if (s.risk) console.log(`risk: ${s.risk}`);
    } else {
      console.log(`(unscoped: scope_status=${i.scope_status})`);
    }
    console.log("");
  }
}

await sql.end();
