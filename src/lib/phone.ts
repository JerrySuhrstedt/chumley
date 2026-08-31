const digits = (value: string) => value.replace(/\D/g, "");

/**
 * The most digits any real number has. E.164 caps a full international
 * number at fifteen, so anything past that is a typo or a paste gone wrong,
 * and letting it run unbounded means a field that accepts a novel.
 */
const MAX_DIGITS = 15;

/**
 * Strip what a phone number cannot contain.
 *
 * Reported as "+++971 __44 saved verbatim". Nothing rejected the junk
 * because a value starting with + was treated as foreign and passed
 * straight through untouched. Keeps digits, one leading +, and the
 * separators people actually type; collapses the rest.
 */
export function sanitizePhoneInput(value: string): string {
  const kept = value.replace(/[^\d+()\-. xX#extEXT]/g, "");
  const plus = kept.trimStart().startsWith("+");
  const body = kept.replace(/\+/g, "");
  const capped =
    digits(body).length > MAX_DIGITS
      ? (() => {
          let n = 0;
          return body
            .split("")
            .filter((c) => (/\d/.test(c) ? ++n <= MAX_DIGITS : true))
            .join("");
        })()
      : body;
  return (plus ? "+" : "") + capped.replace(/\s{2,}/g, " ");
}

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
 * Split a NANP number into its country code and its ten digits.
 *
 * No NANP area code begins with 1, so a leading 1 is always the country
 * code and never part of the number. That fact is what makes this safe to
 * decide on the second keystroke rather than waiting for the eleventh.
 *
 * Waiting was the bug. A half-typed 1-800 number sat at ten digits and
 * rendered as "(180) 055-5123", visibly scrambled, then snapped to
 * "(800) 555-1234" on the next keystroke with the 1 apparently eaten. The
 * fix is not to strip it sooner but to stop hiding it: the 1 is shown
 * outside the parentheses, where it belongs, so nothing ever disappears
 * and nothing is ever mis-grouped.
 */
/**
 * Could these digits be a North American number at all?
 *
 * NANP reserves 0 and 1 as the first digit of both the area code and the
 * exchange code, so "050 123 4567" is not a badly typed US number, it is
 * somebody in Abu Dhabi typing their own. Checking costs nothing and stops
 * the mask forcing a foreign local number into "(050) 123-4567", which is
 * both wrong and undiallable.
 *
 * This is deliberately not full international support. Numbers written
 * with a + already pass through untouched and dial correctly, so the only
 * thing missing was the humility to leave alone what is not ours.
 */
function looksNanp(d: string): boolean {
  if (d.length >= 1 && (d[0] === "0" || d[0] === "1")) return false;
  if (d.length >= 4 && (d[3] === "0" || d[3] === "1")) return false;
  return true;
}

function nanp(value: string) {
  const d = digits(value);
  if (d.startsWith("1")) {
    return { cc: "1", rest: d.slice(1, 11) };
  }
  return { cc: "", rest: d.slice(0, 10) };
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

  /**
   * More digits than a NANP number can hold, so it is something else: an
   * 0044 international number typed without a plus, an account reference,
   * a paste gone wrong. Left exactly as entered rather than forced into a
   * shape it does not have. Dropping this guard turned "0044 20 7946 0958"
   * into "(004) 420-7946", which is worse than doing nothing.
   */
  const all = digits(base);
  if (all.length > (all.startsWith("1") ? 11 : 10)) return value;

  const { cc, rest: d } = nanp(base);
  if (d.length === 0 && !cc) return ext !== null ? value : "";
  // Not a shape NANP can produce, so it belongs to some other country's
  // numbering plan. Left exactly as typed.
  if (!looksNanp(d)) return value;

  // The country code stands outside the parentheses so it stays visible.
  const lead = cc ? `${cc} ` : "";
  if (d.length === 0) return ext !== null ? `${cc} x${ext}` : cc;

  let out: string;
  if (d.length < 4) out = `${lead}(${d}`;
  else if (d.length < 7) out = `${lead}(${d.slice(0, 3)}) ${d.slice(3)}`;
  else out = `${lead}(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
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

  /**
   * Cleaned here as well as in the input, because this is the last gate
   * before storage and values do not only arrive by keyboard. The website
   * form, the CSV import and the API all land here, and "+++971 __44" was
   * being kept verbatim by every one of them.
   */
  const trimmed = sanitizePhoneInput(value).trim();
  if (!trimmed) return null;
  if (isForeign(trimmed)) return trimmed;

  const { base, ext } = splitExtension(trimmed);

  /**
   * Too many digits to be a NANP number, so it is something else and gets
   * kept as entered. formatPhoneInput has always guarded this; normalize
   * did not need to while nanp() returned every digit, because the
   * length check below simply failed. nanp() now truncates to ten, so
   * without this an international number typed in 00-prefix form
   * ("00971 50 123 4567") was reshaped into "(009) 715-0123" on save.
   */
  const allDigits = digits(base);
  if (allDigits.length > (allDigits.startsWith("1") ? 11 : 10)) {
    return trimmed;
  }

  const { cc, rest: d } = nanp(base);
  if (!looksNanp(d)) return trimmed;
  if (d.length === 10) {
    const lead = cc ? `${cc} ` : "";
    const formatted = `${lead}(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
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
  const { rest } = nanp(base);
  if (!looksNanp(rest)) {
    // Somebody else's local number. Dial it if it is a plausible length.
    const d = digits(base);
    return d.length >= 7 && d.length <= 15;
  }
  return rest.length === 10;
}
