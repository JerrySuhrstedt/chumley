import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

/**
 * The database client, tuned for serverless behind Supabase's pooler.
 *
 * DATABASE_URL must point at the transaction pooler on port 6543, not at
 * the database directly on 5432. Every Vercel function instance is its own
 * process with its own pool, and a few dozen warm instances talking
 * straight to Postgres will exhaust its connection limit long before the
 * app is under any real load. The pooler exists to multiplex exactly that.
 *
 * The settings below matter more than they look:
 *
 * `prepare: false` is not optional. postgres-js uses prepared statements by
 * default and PgBouncer in transaction mode hands each statement whichever
 * backend is free, so a statement prepared on one connection is executed on
 * another that has never seen it. The failure is intermittent and reads
 * like a random query bug, which is the worst kind to chase.
 *
 * `idle_timeout` is what actually protects the connection limit. Without
 * it a container that served one request at 9am holds its connections open
 * until the platform reaps the whole instance, so idle traffic pins
 * connections it is not using. Twenty seconds is longer than the gap
 * between a rep's page loads and far shorter than a warm instance's life.
 *
 * `max` is deliberately not 1, which is the usual serverless advice and is
 * wrong here. Several pages issue three or four queries through
 * Promise.all, and one connection would quietly serialise them, turning a
 * parallel fetch into a sequence of round trips on a phone connection.
 * Five covers the widest fan-out with room spare.
 *
 * `max_lifetime` recycles connections so a single long-lived instance
 * cannot sit on the same backend indefinitely.
 */
const client = postgres(connectionString, {
  prepare: false,
  max: 5,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
});

export const db = drizzle(client, { schema });
