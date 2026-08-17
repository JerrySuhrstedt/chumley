const digits = (value: string) => value.replace(/\D/g, "");

/**
 * True only for non-NANP numbers (+44, +52, ...). A "+1" number is US/Canada
 * and still formats as (XXX) XXX-XXXX.
 */
function isForeign(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith("+") && !digits(trimmed).startsWith("1");
}

/**
 * Drop a leading country code. No NANP area code starts with 1, so a leading
 * 1 is always the country code once another digit follows.
 */
function nanp(value: string) {
  let d = digits(value);
  if (d.length > 1 && d.startsWith("1")) d = d.slice(1);
  return d.slice(0, 10);
}

/**
 * Progressive formatting while typing: "6025551234" -> "(602) 555-1234".
 * Partial input formats as far as it can.
 */
export function formatPhoneInput(value: string): string {
  if (isForeign(value)) return value;

  const d = nanp(value);
  if (d.length === 0) return "";
  if (d.length < 4) return `(${d}`;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/**
 * Normalize a stored number. Anything that isn't a complete NANP number is
 * kept as entered rather than mangled.
 */
export function normalizePhone(
  value: string | null | undefined
): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (isForeign(trimmed)) return trimmed;

  const d = nanp(trimmed);
  if (d.length === 10) {
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  return trimmed;
}

/** Dialable form for tel:/sms: links — punctuation confuses some handlers. */
export function telDigits(value: string | null | undefined): string | null {
  if (!value) return null;
  if (isForeign(value)) return value.trim().replace(/[^\d+]/g, "");
  const d = digits(value);
  return d.length > 0 ? d : null;
}
