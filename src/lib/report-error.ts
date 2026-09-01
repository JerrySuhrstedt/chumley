import { alertAsync } from "@/lib/alert";
import {
  DEACTIVATED_MESSAGE,
  NO_ORG_MESSAGE,
  READ_ONLY_MESSAGE,
  TRIAL_ENDED_MESSAGE,
} from "@/lib/gate-messages";

/**
 * Turning a thrown error into something a human hears about.
 *
 * Until now the billing path was the only thing that could reach anybody.
 * Everything else threw, Next rendered its error page, and the only record
 * was a line in Vercel's log that nobody opens unless they already suspect
 * a problem. So the failures you find out about were the ones a customer
 * bothered to report, which is the minority and always the slow way.
 */

/**
 * Refusals, not faults.
 *
 * The gate throws to stop a write, and Next throws to redirect or to render
 * a 404. All of them travel as exceptions and none of them are bugs.
 * Alerting on them would bury the real thing under noise within a day,
 * which is the usual way error reporting gets switched off.
 */
const EXPECTED = new Set([
  READ_ONLY_MESSAGE,
  TRIAL_ENDED_MESSAGE,
  DEACTIVATED_MESSAGE,
  NO_ORG_MESSAGE,
]);

const NEXT_CONTROL_FLOW = /^(NEXT_REDIRECT|NEXT_NOT_FOUND|NEXT_HTTP_ERROR_FALLBACK)/;

function isExpected(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (EXPECTED.has(message)) return true;
  if (NEXT_CONTROL_FLOW.test(message)) return true;
  // Next tags its own control-flow throws on a digest property too.
  const digest = (error as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && NEXT_CONTROL_FLOW.test(digest);
}

/**
 * A stable name for this bug, not this occurrence.
 *
 * Keyed on the message and where it happened rather than the stack, so the
 * same fault from a hundred requests is one email. Line numbers move
 * between deploys and would split one bug into a fresh alert every release.
 *
 * Ids and long numbers are blanked first, so the same fault about two
 * different leads groups as one thing rather than as many.
 *
 * FNV-1a rather than node:crypto. This is a grouping label, not a security
 * boundary, and importing a Node built-in for it would rule the module out
 * of the Edge runtime for no benefit anybody can see.
 */
function signature(message: string, where: string): string {
  const normalised = message
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "<id>")
    .replace(/\b\d{3,}\b/g, "<n>")
    .slice(0, 200);

  const input = `${where}::${normalised}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export function reportError(
  error: unknown,
  where: string,
  extra?: Record<string, string | undefined>
): void {
  if (isExpected(error)) return;

  const message = error instanceof Error ? error.message : String(error ?? "");
  const stack = error instanceof Error ? (error.stack ?? "") : "";
  const key = `error-${signature(message, where)}`;

  console.error(`[${where}] ${message}`, error);

  const lines = [
    `Where:   ${where}`,
    ...Object.entries(extra ?? {})
      .filter(([, v]) => v)
      .map(([k, v]) => `${k.padEnd(8)} ${v}`),
    "",
    message,
    "",
    stack.split("\n").slice(1, 9).join("\n"),
  ];

  alertAsync(key, `Chumley error: ${message.slice(0, 80)}`, lines.join("\n"));
}

/**
 * A crash reported by somebody's browser, which means by somebody.
 *
 * Server-side reportError keys its throttle on the error message, which
 * is fine when the message came from our own code and catastrophic when
 * it came off the wire: every distinct string mints a fresh key, a fresh
 * key always sends, and a scripted stranger can drain the day's email
 * quota in a minute, taking magic-link sign-in down with it. So browser
 * reports share ONE fixed key and a fixed subject. A real flood of
 * distinct browser bugs becomes one email per throttle window with the
 * detail in the body, and the rest is in the server log where it always
 * was.
 */
export function reportBrowserError(
  message: string,
  path: string,
  extra?: Record<string, string | undefined>
): void {
  console.error(`[browser${path}] ${message}`);

  const lines = [
    `Where:   browser${path}`,
    ...Object.entries(extra ?? {})
      .filter(([, v]) => v)
      .map(([k, v]) => `${k.padEnd(8)} ${v}`),
    "",
    message,
  ];

  alertAsync("error-browser", "Chumley error: browser report", lines.join("\n"));
}
