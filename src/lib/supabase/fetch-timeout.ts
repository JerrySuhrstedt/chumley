/**
 * fetch with a ceiling, for talking to Supabase's auth API.
 *
 * The middleware refreshes the session on every request, and that call
 * had no timeout: when Supabase's gateway degraded on 08-25-2026, every
 * page of the app hung for as long as the gateway felt like taking,
 * which the browser reports as forever. Eight seconds is generous for
 * an auth round trip and short enough that a sick vendor turns into a
 * fast redirect to the login page instead of a frozen tab.
 *
 * The caller's own abort signal still wins when it fires first.
 */
export function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const timeout = AbortSignal.timeout(8_000);
  const signal = init?.signal
    ? AbortSignal.any([init.signal, timeout])
    : timeout;
  return fetch(input, { ...init, signal });
}
