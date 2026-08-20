import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { activities, leads } from "@/db/schema";

export type OnboardingStep = {
  key: "account" | "name" | "deal" | "move" | "contact";
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
  const [realLeads, moved, contacted] = await Promise.all([
    db
      .select({ n: count() })
      .from(leads)
      .where(and(eq(leads.orgId, orgId), eq(leads.isSample, false))),

    // Any stage change is proof a card has been dragged or moved.
    db
      .select({ n: count() })
      .from(activities)
      .where(and(eq(activities.orgId, orgId), eq(activities.type, "stage_change"))),

    // Reaching out, by any of the three routes. Logged automatically when
    // the call, text or email button is tapped, so this cannot be ticked
    // off by intending to do it.
    db
      .select({ n: count() })
      .from(activities)
      .where(
        and(
          eq(activities.orgId, orgId),
          inArray(activities.type, ["call", "text", "email"])
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
      key: "contact",
      label: "Call, text or email someone",
      hint: "Tap the phone, message or mail icon on any card. It logs itself.",
      // The step that proves the product. Tapping a name to ring it is
      // the reason a rep would use this instead of a spreadsheet, and it
      // was the only part of the first five minutes the list never asked
      // for. Two thirds of teams had never once tried it.
      done: Number(contacted[0]?.n ?? 0) > 0,
    },
  ];

  const done = steps.filter((s) => s.done).length;

  return { steps, done, total: steps.length, complete: done === steps.length };
}
