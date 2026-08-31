import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { uatTesters } from "@/db/schema";
import { UatClient } from "../uat-client";

/**
 * A personal tester link: /uat/{token}. Same page as /uat, but the tester
 * is known by name, skips the sign-in form, and their run autosaves to
 * the server so the identical link resumes it on any device. An unknown
 * token 404s rather than degrading to the anonymous page, because a
 * tester with a mistyped link should find out now, not after an hour of
 * testing that saved nowhere.
 */
export const metadata: Metadata = {
  title: "Tester punch list | Chumley",
  robots: { index: false, follow: false },
};

export default async function UatTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const rows = await db
    .select({
      token: uatTesters.token,
      name: uatTesters.name,
      email: uatTesters.email,
      draft: uatTesters.draft,
      focus: uatTesters.focus,
      round: uatTesters.round,
    })
    .from(uatTesters)
    .where(eq(uatTesters.token, token))
    .limit(1);
  const tester = rows[0];
  if (!tester) notFound();

  return (
    <UatClient
      tester={{
        token: tester.token,
        name: tester.name,
        email: tester.email,
        savedItems: tester.draft ?? null,
        focus: tester.focus ?? null,
        round: tester.round,
      }}
    />
  );
}
