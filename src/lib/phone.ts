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
 * A trailing extension: "x22", "ext 22", "ext. 22", "#22". The digits are
 * optional so a half-typed "x" survives formatting instead of being eaten
 * by the reformat before its digits arrive.
 */
const EXT_RE = /^(.*?)[\s.,-]*(?:ext\.?|x|#)[\s.]*(\d{0,6})\s*$/i;

/** Split "…1234 x22" into the dialable base and the extension. */
export function splitExtension(value: string): {
  base: string;
  ext: string | null;
} {
  const m = EXT_RE.exec(value.trim());
  if (!m) return { base: value, ext: null };
  return { base: m[1], ext: m[2] };
}

/**
 * Drop a leading country code, but only from a complete run. During typing
 * every leading-1 number passes through a two-digit state, and stripping
 * there eats the keystroke: type "1", then "6", and the 1 vanished.
 */
function nanp(value: string) {
  let d = digits(value);
  if (d.length >= 11 && d.startsWith("1")) d = d.slice(1);
  return d;
}

/**
 * Progressive formatting while typing: "6025551234" -> "(602) 555-1234".
 * Partial input formats as far as it can; anything that cannot be a NANP
 * number (too many digits, foreign) is left exactly as typed rather than
 * mangled into a shape it does not have.
 */
export function formatPhoneInput(value: string): string {
  if (isForeign(value)) return value;

  const { base, ext } = splitExtension(value);
  const d = nanp(base);
  if (d.length === 0) return ext !== null ? value : "";
  if (d.length > 10) return value;

  let out: string;
  if (d.length < 4) out = `(${d}`;
  else if (d.length < 7) out = `(${d.slice(0, 3)}) ${d.slice(3)}`;
  else out = `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return ext !== null ? `${out} x${ext}` : out;
}

/**
 * Normalize a stored number, keeping the extension. Anything that isn't a
 * complete NANP number is kept as entered rather than mangled.
 */
export function normalizePhone(
  value: string | null | undefined
): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (isForeign(trimmed)) return trimmed;

  const { base, ext } = splitExtension(trimmed);
  const d = nanp(base);
  if (d.length === 10) {
    const formatted = `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    return ext ? `${formatted} x${ext}` : formatted;
  }
  return trimmed;
}

/**
 * Dialable form for tel:/sms: links — punctuation confuses some handlers,
 * and an extension appended to the digits mis-dials, so it stops at the
 * base number.
 */
export function telDigits(value: string | null | undefined): string | null {
  if (!value) return null;
  if (isForeign(value)) return value.trim().replace(/[^\d+]/g, "");
  const { base } = splitExtension(value);
  const d = digits(base);
  return d.length > 0 ? d : null;
}

/**
 * Whether Call/Text should light up at all: a complete NANP number or a
 * plausible foreign one. Deliberately stricter than telDigits — "ext 4412"
 * has digits, but dialling 4412 is worse than a disabled button.
 */
export function isDialable(value: string | null | undefined): boolean {
  if (!value) return false;
  if (isForeign(value)) {
    const d = digits(value);
    return d.length >= 7 && d.length <= 15;
  }
  const { base } = splitExtension(value);
  return nanp(base).length === 10;
}
