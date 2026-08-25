import { reportError } from "@/lib/report-error";

/**
 * Next calls this for every unhandled error on the server: pages, route
 * handlers and server actions alike. One hook rather than a try/catch in
 * every action, which is the version that gets forgotten in the file
 * somebody writes next week.
 */
export function onRequestError(
  error: unknown,
  request: { path?: string; method?: string },
  context: { routerKind?: string; routePath?: string; renderSource?: string }
): void {
  reportError(error, context.routePath ?? request.path ?? "unknown", {
    method: request.method,
    path: request.path,
    source: context.renderSource ?? context.routerKind,
  });
}
