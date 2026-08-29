import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

/**
 * WARNING: this loads .env.local, so `db:migrate` and `db:studio` run against
 * whatever DATABASE_URL that file holds, which in normal dev is PRODUCTION.
 * A migration or a studio edit here is applied to real customer data.
 *
 * To point migrations at another database without editing .env.local, set
 * MIGRATION_DATABASE_URL and it wins. Use a direct (non-pooler) connection
 * string for migrations: drizzle-kit runs DDL, and the transaction pooler is
 * the wrong endpoint for that. `db:generate` writes SQL files only and needs
 * no live connection, so nothing below should ever break it.
 */
const migrationUrl = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;

if (!migrationUrl) {
  throw new Error("Neither MIGRATION_DATABASE_URL nor DATABASE_URL is set");
}

export default defineConfig({
  schema: ["./src/db/schema.ts", "./src/db/auth-schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: migrationUrl,
  },
});
