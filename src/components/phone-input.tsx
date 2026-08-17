"use client";

import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { formatPhoneInput } from "@/lib/phone";

/**
 * Formats to (XXX) XXX-XXXX as the user types. Deliberately uncontrolled so
 * form.reset() still clears it after a successful submit.
 */
export function PhoneInput(props: ComponentProps<typeof Input>) {
  return (
    <Input
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      placeholder="(555) 123-4567"
      {...props}
      defaultValue={
        props.defaultValue
          ? formatPhoneInput(String(props.defaultValue))
          : props.defaultValue
      }
      onChange={(event) => {
        event.target.value = formatPhoneInput(event.target.value);
        props.onChange?.(event);
      }}
    />
  );
}
