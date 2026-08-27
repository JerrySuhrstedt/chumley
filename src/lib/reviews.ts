import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { reviews } from "@/db/schema";

export type PublishedReview = {
  quote: string;
  name: string;
  company: string | null;
  rating: number;
};

/** What the homepage shows: the newest published, three at a time. */
export async function getPublishedReviews(limit = 3): Promise<PublishedReview[]> {
  const rows = await db
    .select({
      quote: reviews.quote,
      name: reviews.name,
      company: reviews.company,
      rating: reviews.rating,
    })
    .from(reviews)
    .where(eq(reviews.status, "published"))
    .orderBy(desc(reviews.publishedAt))
    .limit(limit);
  return rows;
}

/** The signed-in user's own review, if they have left one. */
export async function getMyReview(userId: string) {
  return db.query.reviews.findFirst({
    where: eq(reviews.userId, userId),
  });
}
