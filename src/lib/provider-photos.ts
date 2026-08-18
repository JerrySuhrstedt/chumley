import { sql } from "drizzle-orm";
import { db } from "@/db";

export type ProviderPhoto = {
  provider: string;
  label: string;
  url: string;
};

const LABELS: Record<string, string> = {
  google: "Google",
  linkedin_oidc: "LinkedIn",
  email: "Email",
};

/**
 * Photos handed over by whatever accounts the user has signed in with.
 *
 * Supabase writes the first provider's picture onto the user record and
 * leaves it there when later providers link, so reading the identities
 * directly is the only way to offer a real choice between them.
 */
export async function getProviderPhotos(
  userId: string
): Promise<ProviderPhoto[]> {
  const rows = (await db.execute(sql`
    SELECT provider,
           COALESCE(identity_data->>'avatar_url', identity_data->>'picture') AS url
    FROM auth.identities
    WHERE user_id = ${userId}
    ORDER BY created_at
  `)) as unknown as { provider: string; url: string | null }[];

  return rows
    .filter((r): r is { provider: string; url: string } => Boolean(r.url))
    .map((r) => ({
      provider: r.provider,
      label: LABELS[r.provider] ?? r.provider,
      url: r.url,
    }));
}
