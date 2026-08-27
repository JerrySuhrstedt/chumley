"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { PRICE, TRIAL_DAYS } from "./plans";

function StartFree() {
  return (
    <>
      <Link
        href="/login?mode=signup"
        className="mt-8 inline-block rounded-xl bg-[var(--brand)] px-11 py-4 text-center text-lg font-bold text-white transition-colors hover:bg-[var(--brand-dark)]"
      >
        Start your {TRIAL_DAYS} free days
      </Link>
      <p className="mt-3 text-xs text-[var(--ink-muted)]">
        No card to start · Cancel any time · Day {TRIAL_DAYS + 1} is the first
        one that costs anything
      </p>
    </>
  );
}

/**
 * The whole pricing page is one number, and that is the point.
 *
 * One flat price per user per month: no tiers, no annual contract, no
 * volume ladder, no feature chart. The simplicity is the positioning,
 * aimed straight at buyers burned by CRMs where the real price takes a
 * sales call to find out.
 */
export function PlanCards() {
  const [seats, setSeats] = useState(3);
  const step = (by: number) =>
    setSeats((s) => Math.max(1, Math.min(50, s + by)));

  const NOT_HERE = [
    'A "Pro" tier hiding the good features',
    "An annual contract to squeeze you into",
    "A price that changes when you grow",
    'A "Contact us" button where a number should be',
    "Per-feature add-ons",
    "A surprise at renewal",
  ];

  return (
    <div className="text-center">
      <p className="mt-12 leading-none">
        <span className="align-top text-4xl font-bold text-[var(--ink-soft)]">
          $
        </span>
        <span className="text-[7rem] font-extrabold tracking-tighter text-[var(--ink)] tabular-nums">
          {PRICE}
        </span>
      </p>
      <p className="mt-2 text-lg text-[var(--ink-soft)]">per user, per month</p>
      <p className="mt-4 text-[17px] font-semibold text-[var(--ink)]">
        That&apos;s it. That&apos;s the pricing.
      </p>

      <p className="mx-auto mt-6 max-w-[46ch] text-[15px] text-[var(--ink-soft)]">
        No tiers, no annual contract, no volume ladder, no feature chart, no
        sales call to find out the real number. Every person on your team is{" "}
        <strong className="text-[var(--ink)]">${PRICE} a month</strong>, and
        every one of them gets the whole product.
      </p>

      <StartFree />

      {/* The team math, done in the open. */}
      <div className="mx-auto mt-14 max-w-sm rounded-2xl border border-[var(--rule)] bg-white p-6">
        <p className="text-xs font-bold tracking-wider text-[var(--ink-muted)] uppercase">
          What would my team cost?
        </p>
        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            type="button"
            aria-label="Fewer people"
            onClick={() => step(-1)}
            className="flex size-9 items-center justify-center rounded-lg border border-[var(--rule)] hover:bg-[var(--brand-tint)]"
          >
            <Minus className="size-4" />
          </button>
          <span className="min-w-24 text-lg font-bold tabular-nums">
            {seats} {seats === 1 ? "person" : "people"}
          </span>
          <button
            type="button"
            aria-label="More people"
            onClick={() => step(1)}
            className="flex size-9 items-center justify-center rounded-lg border border-[var(--rule)] hover:bg-[var(--brand-tint)]"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <p className="mt-3 text-[15px] text-[var(--ink-soft)]">
          {seats} × ${PRICE} ={" "}
          <span className="text-xl font-bold text-[var(--ink)] tabular-nums">
            ${seats * PRICE}
          </span>{" "}
          a month
        </p>
      </div>

      {/* What is deliberately missing. */}
      <div className="mx-auto mt-14 max-w-xl text-left">
        <h3 className="text-center text-base font-bold text-[var(--ink)]">
          Things this pricing page does not have
        </h3>
        <ul className="mt-4 grid gap-x-6 gap-y-1.5 text-[14.5px] text-[var(--ink-soft)] sm:grid-cols-2">
          {NOT_HERE.map((line) => (
            <li key={line} className="flex items-start gap-2.5">
              <X className="mt-1 size-3.5 shrink-0 text-[var(--brand)]" strokeWidth={3} />
              {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
