/**
 * Today's date where the person is, as YYYY-MM-DD.
 *
 * Not toISOString().slice(0, 10). That converts to UTC first, so from
 * 5pm in Arizona onward it returns tomorrow, and next_action_due is a
 * plain calendar date somebody picked in their own timezone. The two
 * disagreeing for seven hours every evening made steps due today turn
 * red and steps due tomorrow claim to be due now, which is the one piece
 * of the product that has to be trusted.
 *
 * Call it from the browser. On a server it is the server's day, which on
 * Vercel is UTC and is exactly the thing being avoided.
 */
export function localToday(d: Date = new Date()): string {
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

/** Morning, afternoon or evening, by the reader's own clock. */
export function greetingFor(d: Date = new Date()): string {
  const hour = d.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
