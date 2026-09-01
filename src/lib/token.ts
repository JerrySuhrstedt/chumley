/**
 * The webhook/form tokens in the URL are uuid columns. Postgres raises
 * 22P02 on a comparison against anything that is not a uuid, which
 * surfaces as an unhandled 500 rather than an honest 404 - and each 500
 * on the public /f pages trips the browser error boundary, which reports
 * to /api/client-error, so a crawler hitting garbage tokens turns a
 * validation gap into alert traffic. Cheaper to reject the shape first.
 */
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID.test(value);
}
