import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { getCurrentOrg } from "@/lib/org";
import { getBillingState } from "@/lib/paddle/access";
import {
  DEACTIVATED_MESSAGE,
  NO_ORG_MESSAGE,
  READ_ONLY_MESSAGE,
  TRIAL_ENDED_MESSAGE,
} from "@/lib/gate-messages";

/**
 * May this team change anything right now?
 *
 * getBillingState has always worked out the answer correctly and nothing
 * read it, so a lapsed subscription stopped the money and left the app
 * running. The seat count had the same problem: it was drawn on the Team
 * page and never checked when somebody actually joined.
 *
 * The rule is the same in both cases. Compute it once, here, and make
 * every write go through it, so a new action cannot forget.
 *
 * Reading is deliberately never blocked. Holding a salesperson's own
 * contacts hostage over a card that expired is not a business model, and
 * the export and billing screens have to stay reachable precisely for the
 * people who are locked out of everything else.
 */

export type CurrentOrg = NonNullable<Awaited<ReturnType<typeof getCurrentOrg>>>;

export {
  READ_ONLY_MESSAGE,
  DEACTIVATED_MESSAGE,
  NO_ORG_MESSAGE,
} from "@/lib/gate-messages";

type Allowed = { current: CurrentOrg; error: null };
type Refused = { current: null; error: string };

/**
 * The signed-in team, but only if it is allowed to write.
 *
 * For actions that report failure to the caller. The ones with nowhere to
 * put an error use requireWritableOrg below.
 */
export async function getWritableOrg(): Promise<Allowed | Refused> {
  const current = await getCurrentOrg();
  if (!current) return { current: null, error: NO_ORG_MESSAGE };

  // Switched off by an administrator outranks anything billing says, and
  // it is checked here as well as in the layout because a server action
  // never renders the layout.
  if (current.org.deactivatedAt) {
    return { current: null, error: DEACTIVATED_MESSAGE };
  }

  const billing = await getBillingState(current.org.id);
  if (billing.readOnly) {
    // A team that never subscribed is out of trial, not out of plan.
    const never = billing.subscription === null;
    return {
      current: null,
      error: never ? TRIAL_ENDED_MESSAGE : READ_ONLY_MESSAGE,
    };
  }

  return { current, error: null };
}

/** The throwing form, for actions whose return value has no room for an error. */
export async function requireWritableOrg(): Promise<CurrentOrg> {
  const { current, error } = await getWritableOrg();
  if (!current) throw new Error(error);
  return current;
}

/**
 * Whether one more person can join this team.
 *
 * Separate from writability because the answer differs: a team that is
 * paid up and full may write all it likes and still not add anybody.
 * seatsLeft is Infinity while nothing is being billed, so a free team is
 * not capped by a number it never agreed to.
 */
export async function seatCheck(
  orgId: string,
): Promise<
  | { ok: true; cap: number | null; error: null }
  | { ok: false; cap: null; error: string }
> {
  // An administrator switch-off outranks billing, exactly as it does for
  // writes. Without this a deactivated team could keep seating members
  // through an invite link, since billing alone never sees the switch.
  const [org] = await db
    .select({ deactivatedAt: organizations.deactivatedAt })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  if (!org || org.deactivatedAt) {
    return { ok: false, cap: null, error: DEACTIVATED_MESSAGE };
  }

  const billing = await getBillingState(orgId);

  if (billing.readOnly) {
    return {
      ok: false,
      cap: null,
      error:
        billing.subscription === null
          ? "That team's free trial has ended, so it cannot take anyone new."
          : "That team's plan has ended, so it cannot take anyone new.",
    };
  }

  if (billing.seatsLeft <= 0) {
    return {
      ok: false,
      cap: null,
      error: `That team has all ${billing.seats} of its seats filled. The owner can add one in Billing.`,
    };
  }

  // The number to hold the team to, or null while nothing is billed. The
  // caller needs it because checking and then inserting is two steps, and
  // two people opening the same invite link at once both pass the check.
  return {
    ok: true,
    cap: Number.isFinite(billing.seatsLeft) ? billing.seats : null,
    error: null,
  };
}
