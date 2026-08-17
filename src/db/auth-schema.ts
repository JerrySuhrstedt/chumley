import { pgSchema, uuid, text } from "drizzle-orm/pg-core";

// Read-only reference to Supabase's built-in `auth.users` table, which lives
// in the same Postgres database. Not managed by our Drizzle migrations —
// intentionally kept out of drizzle.config.ts's schema path.
const authSchema = pgSchema("auth");

export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
  email: text("email"),
});
