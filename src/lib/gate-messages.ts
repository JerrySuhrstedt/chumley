/**
 * What a blocked write says, kept apart from the gate itself.
 *
 * The gate reaches the database and the session, so a client component
 * cannot import it without dragging server code into the browser bundle.
 * The board needs the wording, so the wording lives here on its own.
 */

export const READ_ONLY_MESSAGE =
  "Your plan has ended, so the board is read-only. Restart it in Settings, Billing and everything works again.";

/**
 * The same lock-out, but for somebody who never had a plan to end.
 * Telling a trial user their "plan has ended" reads as a billing error on
 * an account they have never paid a penny into.
 */
export const TRIAL_ENDED_MESSAGE =
  "Your free trial has ended, so the board is read-only. Nothing has been deleted. Pick a plan in Settings, Billing and everything works again.";

export const DEACTIVATED_MESSAGE =
  "This account is switched off. Get in touch and we will sort it out.";

export const NO_ORG_MESSAGE = "No organization for the current user.";
