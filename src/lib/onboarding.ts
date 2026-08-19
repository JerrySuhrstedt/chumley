import { and, count, eq, isNotNull, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { activities, leads } from "@/db/schema";

export type OnboardingStep = {
  key: "account" | "name" | "deal" | "move" | "next";
  label: string;
  /** What they get, not what we want. */
  hint: string;
  done: boolean;
};

export type OnboardingState = {
  steps: OnboardingStep[];
  done: number;
  total: number;
  complete: boolean;
};

/**
 * Progress is derived from what the user has actually done, never from a
 * "mark as read" button.
 *
 * Two consequences worth keeping. Nothing can be ticked off without the
 * work being real, which is what makes finishing the list feel earned
 * rather than clicked. And there is no progress table to migrate, drift,
 * or repair; the answer is recomputed from the same rows the app already
 * reads.
 *
 * Sample leads are excluded throughout. Seeded deals are ours, not theirs,
 * and crediting somebody for a deal we added would be the one lie that
 * makes the whole list worthless.
 */
export async function getOnboardingState(
  orgId: string,
  displayName: string | null
): Promise<OnboardingState> {
  const [realLeads, moved, planned] = await Promise.all([
    db
      .select({ n: count() })
      .from(leads)
      .where(and(eq(leads.orgId, orgId), eq(leads.isSample, false))),

    // Any stage change is proof a card has been dragged or moved.
    db
      .select({ n: count() })
      .from(activities)
      .where(and(eq(activities.orgId, orgId), eq(activities.type, "stage_change"))),

    db
      .select({ n: count() })
      .from(leads)
      .where(
        and(
          eq(leads.orgId, orgId),
          eq(leads.isSample, false),
          isNotNull(leads.nextActionText),
          ne(leads.nextActionText, sql`''`)
        )
      ),
  ]);

  const steps: OnboardingStep[] = [
    {
      key: "account",
      label: "Create your account",
      hint: "Done the moment you signed up.",
      // Starts the list above zero on purpose. A meter that opens at
      // nothing reads as a chore; one already moving reads as a run to
      // finish. Same four steps left either way.
      done: true,
    },
    {
      key: "deal",
      label: "Add your first deal",
      hint: "A name and a phone number is all it takes.",
      done: Number(realLeads[0]?.n ?? 0) > 0,
    },
    {
      key: "name",
      label: "Tell us your name",
      hint: "So your team knows who did what.",
      done: Boolean(displayName?.trim()),
    },
    {
      key: "move",
      label: "Move a deal forward",
      hint: "Drag a card right, or tap Move to on a phone.",
      done: Number(moved[0]?.n ?? 0) > 0,
    },
    {
      key: "next",
      label: "Set what happens next",
      hint: "The card turns red when it is late. That is the whole system.",
      done: Number(planned[0]?.n ?? 0) > 0,
    },
  ];

  const done = steps.filter((s) => s.done).length;

  return { steps, done, total: steps.length, complete: done === steps.length };
}
