import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

/**
 * What the outside watcher pings.
 *
 * The homepage is CDN-cached and can look perfectly alive while the
 * database is unreachable, which is exactly the failure the 08-25
 * incident taught us to fear. This answers 200 only when a real query
 * round-trips, so "the monitor is green" means the whole stack is,
 * and it answers fast or not at all: a health check that hangs is a
 * health check that lies about being one.
 */
export async function GET() {
  const started = Date.now();
  try {
    await Promise.race([
      db.execute(sql`SELECT 1`),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("db timeout")), 5_000)
      ),
    ]);
    return NextResponse.json(
      { ok: true, db: "up", ms: Date.now() - started },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (e) {
    // The detail is the most useful thing here at 2am, but Postgres error
    // text names the DB host and username, and this endpoint is public.
    // Keep it in the server log; hand the public body a fixed string.
    console.error("[health] database unreachable", e);
    return NextResponse.json(
      {
        ok: false,
        db: "down",
        error: "database unreachable",
        ms: Date.now() - started,
      },
      { status: 503, headers: { "cache-control": "no-store" } }
    );
  }
}
