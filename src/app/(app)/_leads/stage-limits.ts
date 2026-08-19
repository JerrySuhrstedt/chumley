/**
 * Shared with the server action that enforces it.
 *
 * Lives in its own file because the server module it belongs to pulls in
 * the database, and a client component importing that would drag the
 * whole of Drizzle into the browser bundle.
 */
export const MAX_OPEN_STAGES = 6;
