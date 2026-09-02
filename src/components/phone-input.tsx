"use client";

import { useRef, useState, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { formatPhoneInput, phoneProblem, sanitizePhoneInput } from "@/lib/phone";

const countDigits = (s: string) => s.replace(/\D/g, "").length;

/** Caret position just after the nth digit of a formatted string. */
function caretAfterDigit(formatted: string, n: number): number {
  if (n <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) {
      seen++;
      if (seen >= n) return i + 1;
    }
  }
  return formatted.length;
}

/**
 * Formats to (XXX) XXX-XXXX as the user types. Deliberately uncontrolled so
 * form.reset() still clears it after a successful submit.
 *
 * Reassigning value on every keystroke throws the caret to the end, so the
 * caret is put back where it was, counted in digits rather than characters
 * because the separators around it just moved. A backspace that removed
 * only a separator would otherwise reformat straight back to the same
 * string; it deletes the digit to its left instead, which is what the
 * keypress meant.
 */
export function PhoneInput(props: ComponentProps<typeof Input>) {
  const lastValue = useRef<string | null>(null);
  /**
   * Too many digits, said while it is being typed rather than at save
   * time (AT-28). The server refuses these too; this is the polite copy
   * of the same rule.
   */
  const [problem, setProblem] = useState<string | null>(() =>
    props.defaultValue ? phoneProblem(String(props.defaultValue)) : null
  );
  return (
    <>
    <Input
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      placeholder="(555) 123-4567"
      aria-invalid={problem ? true : undefined}
      {...props}
      defaultValue={
        props.defaultValue
          ? formatPhoneInput(String(props.defaultValue))
          : props.defaultValue
      }
      onChange={(event) => {
        const input = event.target;
        /**
         * Cleaned before anything else looks at it.
         *
         * Reported from UAT: "+++971 __44" was saved exactly as typed, and
         * digits could be entered without any limit. The formatter below
         * leaves anything it does not recognise alone, which is right, but
         * it meant junk went straight through to the database.
         */
        const raw = sanitizePhoneInput(input.value);
        const prev = lastValue.current;
        const caret = input.selectionStart ?? raw.length;
        let digitsBefore = countDigits(raw.slice(0, caret));
        let toFormat = raw;

        // A deletion that removed no digits was a backspace over a
        // separator: take out the digit to the caret's left instead.
        if (
          prev !== null &&
          raw.length < prev.length &&
          countDigits(raw) === countDigits(prev) &&
          digitsBefore > 0
        ) {
          const all = raw.replace(/\D/g, "");
          toFormat = all.slice(0, digitsBefore - 1) + all.slice(digitsBefore);
          digitsBefore -= 1;
        }

        const formatted = formatPhoneInput(toFormat);
        input.value = formatted;
        lastValue.current = formatted;
        if (document.activeElement === input) {
          const pos = caretAfterDigit(formatted, digitsBefore);
          input.setSelectionRange(pos, pos);
        }
        setProblem(phoneProblem(formatted));
        props.onChange?.(event);
      }}
    />
    {problem && (
      <p className="text-xs text-destructive" role="alert">
        {problem}
      </p>
    )}
    </>
  );
}
