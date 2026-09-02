/**
 * The topic list, in its own module because a "use server" file may only
 * export async functions. Both the form and the action read it from here so
 * the select cannot drift from what the action is willing to accept.
 */
export const TOPICS = [
  "I have a question",
  "Something is broken",
  "Billing or my account",
  "A suggestion",
] as const;
