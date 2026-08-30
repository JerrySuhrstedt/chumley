/**
 * The checklist, the sidebar, and the board live in sibling subtrees, so
 * they talk the way the coach-mark replay already does: window events,
 * with a sessionStorage note for the cases where a navigation happens
 * first and the listener does not exist yet.
 */

/** Open the add-lead dialog (the checklist's "Add a deal" step). */
export const OPEN_ADD_LEAD_EVENT = "chumley:open-add-lead";
/** Set before navigating to /pipeline so the dialog opens on arrival. */
export const OPEN_ADD_LEAD_KEY = "chumley.add-lead.pending";

/** Un-hide the getting-started checklist after a dismissal. */
export const REOPEN_CHECKLIST_EVENT = "chumley:onboarding-reopen";
/** The localStorage flag a dismissal writes. */
export const CHECKLIST_HIDDEN_KEY = "chumley:onboarding-hidden";
