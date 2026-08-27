"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { getCurrentOrg } from "@/lib/org";

export type ReviewFormState = { error: string | null; saved: boolean };

/**
 * A user leaving or editing their review of Chumley.
 *
 * One per user, upserted, and it always lands as "new" for the back
 * office to look at, even on edit: a published quote that quietly
 * changed under our name on the homepage would be worse than the
 * moment of re-approval costs.
 */
export async function submitReview(
  _prev: ReviewFormState,
  formData: FormData
): Promise<ReviewFormState> {
  const current = await getCurrentOrg();
  if (!current) return { error: "You need to be signed in.", saved: false };

  const rating = Number(formData.get("rating"));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Pick a star rating.", saved: false };
  }

  const quote = String(formData.get("quote") ?? "").trim().slice(0, 280);
  if (quote.length < 10) {
    return { error: "Tell us a little more than that.", saved: false };
  }

  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  if (!name) return { error: "Add the name we may show.", saved: false };

  const company =
    String(formData.get("company") ?? "").trim().slice(0, 120) || null;
  const consent = formData.get("consent") === "on";

  const existing = await db.query.reviews.findFirst({
    where: eq(reviews.userId, current.userId),
  });

  if (existing) {
    await db
      .update(reviews)
      .set({
        rating,
        quote,
        name,
        company,
        consentPublic: consent,
        status: "new",
        publishedAt: null,
      })
      .where(eq(reviews.id, existing.id));
  } else {
    await db.insert(reviews).values({
      orgId: current.org.id,
      userId: current.userId,
      rating,
      quote,
      name,
      company,
      consentPublic: consent,
    });
  }

  revalidatePath("/admin");
  return { error: null, saved: true };
}
