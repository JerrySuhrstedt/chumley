"use client";

import { useActionState } from "react";
import { Tag } from "lucide-react";
import { redeemPromoCode } from "./actions";
import type { RedeemResult } from "@/lib/promo";

/**
 * Where a marketed free-time code gets typed in.
 *
 * Quiet on purpose: most people have no code, so it reads as a single
 * line until it has something to say.
 */
export function RedeemCode() {
  const [state, formAction, pending] = useActionState<RedeemResult, FormData>(
    redeemPromoCode,
    { error: null }
  );

  if (state.message) {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800">
        <Tag className="size-4 shrink-0" />
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      <label
        htmlFor="promo-code-input"
        className="text-sm font-semibold text-slate-700"
      >
        Have a promo code?
      </label>
      <div className="flex gap-2">
        <input
          id="promo-code-input"
          name="code"
          placeholder="CODE"
          autoComplete="off"
          className="h-10 w-44 rounded-lg border border-slate-300 px-3 font-mono text-sm tracking-wider uppercase outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {pending ? "Checking..." : "Apply"}
        </button>
      </div>
      {state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}
