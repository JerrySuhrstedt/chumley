"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { INCLUDED, PRICE } from "./plans";

/**
 * One card, one number.
 *
 * The button says "Start free", not "Buy", because nothing charges yet. A
 * price in front of a checkout that does not exist would be a lie; a price
 * in front of a signup is a question, and the answer is worth more right
 * now than the money would be.
 */
export function PlanCards() {
  const [yearly, setYearly] = useState(false);
  const price = yearly ? Math.round(PRICE.yearly / 12) : PRICE.monthly;

  return (
    <>
      <div className="mt-8 flex items-center justify-center gap-3">
        <span
          className={`text-sm font-medium ${yearly ? "text-[var(--ink-muted)]" : "text-[var(--ink)]"}`}
        >
          Monthly
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={yearly}
          aria-label="Pay yearly"
          onClick={() => setYearly((v) => !v)}
          className={`relative h-7 w-12 rounded-full transition-colors ${
            yearly ? "bg-[var(--brand)]" : "bg-slate-300"
          }`}
        >
          <span
            className={`absolute top-1 size-5 rounded-full bg-white transition-transform ${
              yearly ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span
          className={`text-sm font-medium ${yearly ? "text-[var(--ink)]" : "text-[var(--ink-muted)]"}`}
        >
          Yearly
          <span className="ml-1.5 rounded-full bg-[var(--brand-tint)] px-2 py-0.5 text-xs font-bold text-[var(--brand)]">
            2 months free
          </span>
        </span>
      </div>

      <div className="mx-auto mt-10 max-w-xl rounded-2xl border-2 border-[var(--brand)] bg-white p-8 text-left shadow-[0_18px_46px_-18px_rgba(241,101,34,0.45)] sm:p-10">
        <p className="flex items-baseline justify-center gap-2">
          <span className="text-6xl font-extrabold tracking-tight text-[var(--ink)] sm:text-7xl">
            ${price}
          </span>
          <span className="text-lg text-[var(--ink-soft)]">per user</span>
        </p>
        <p className="mt-1 text-center text-[15px] text-[var(--ink-muted)]">
          per month{yearly ? `, billed as $${PRICE.yearly} a year` : ""}
        </p>

        <p className="mx-auto mt-6 max-w-[42ch] text-center text-[17px] font-semibold text-[var(--ink)]">
          No tiers. No contracts. Nothing locked behind an upgrade. One price
          that includes everything.
        </p>

        <Link
          href="/login?mode=signup"
          className="mt-8 block rounded-xl bg-[var(--brand)] px-5 py-4 text-center text-lg font-bold text-white transition-colors hover:bg-[var(--brand-dark)]"
        >
          Start free
        </Link>
        <p className="mt-3 text-center text-sm text-[var(--ink-muted)]">
          {PRICE.trialDays} days free · No credit card · Cancel any time
        </p>

        <ul className="mt-8 grid gap-x-8 gap-y-2.5 border-t border-[var(--rule)] pt-7 sm:grid-cols-2">
          {INCLUDED.map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <Check
                className="mt-0.5 size-4 shrink-0 text-[var(--label-upcoming)]"
                strokeWidth={3}
              />
              <span className="text-[15px] text-[var(--ink-soft)]">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
