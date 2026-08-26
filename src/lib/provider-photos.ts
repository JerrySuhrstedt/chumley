import { sql } from "drizzle-orm";
import { db } from "@/db";

export type ProviderPhoto = {
  provider: string;
  label: string;
  url: string;
};

/**
 * The photo handed over at sign-in.
 *
 * Supabase kept one per identity; Better Auth keeps the latest on the
 * user record, so the choice this used to offer collapsed to a single
 * entry. The shape stays a list because the settings page renders one.
 */
export async function getProviderPhotos(
  userId: string
): Promise<ProviderPhoto[]> {
  const rows = (await db.execute(sql`
    SELECT image FROM users WHERE id = ${userId}::uuid
  `)) as unknown as { image: string | null }[];

  const url = rows[0]?.image;
  if (!url) return [];
  return [{ provider: "account", label: "Sign-in photo", url }];
}
