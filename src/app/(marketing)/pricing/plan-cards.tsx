"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Minus, Plus } from "lucide-react";
import {
  INCLUDED,
  SOLO,
  TEAM_MIN,
  TEAM_NAME,
  TEAM_TIERS,
  TEAM_WHO,
  TRIAL_DAYS,
  tierFor,
  tierLabel,
} from "./plans";

function Toggle({
  yearly,
  onChange,
}: {
  yearly: boolean;
  onChange: (v: boolean) => void;
}) {
  // Two labelled halves rather than a switch. On a pricing page the reader
  // must never have to work out which side is currently active.
  return (
    <div className="inline-flex rounded-full bg-white p-1 shadow-sm ring-1 ring-[var(--rule)]">
      {([false, true] as const).map((opt) => (
        <button
          key={String(opt)}
          type="button"
          aria-pressed={yearly === opt}
          onClick={() => onChange(opt)}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
            yearly === opt
              ? "bg-[var(--brand)] text-white"
              : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
          }`}
        >
          {opt ? "Yearly" : "Monthly"}
          {opt && (
            <span className={yearly ? "ml-1.5 text-white/85" : "ml-1.5 text-[var(--brand)]"}>
              2 months free
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function StartFree({ featured }: { featured?: boolean }) {
  return (
    <>
      <Link
        href="/login?mode=signup"
        className={`mt-6 block rounded-xl px-5 py-3.5 text-center text-base font-bold transition-colors ${
          featured
            ? "bg-[var(--brand)] text-white hover:bg-[var(--brand-dark)]"
            : "border-2 border-[var(--ink)] text-[var(--ink)] hover:bg-slate-50"
        }`}
      >
        Start free
      </Link>
      <p className="mt-2.5 text-center text-xs text-[var(--ink-muted)]">
        {TRIAL_DAYS} days free · No card · Cancel any time
      </p>
    </>
  );
}

/**
 * The button says "Start free", not "Buy". Nothing charges yet, so a price
 * in front of a checkout that does not exist would be a lie. In front of a
 * signup it is a question, and the answer is worth more than the money.
 */
export function PlanCards() {
  const [yearly, setYearly] = useState(false);
  const [seats, setSeats] = useState(TEAM_MIN);

  const period = yearly ? "year" : "month";
  const soloRate = yearly ? SOLO.yearly : SOLO.monthly;

  const tier = tierFor(seats);
  const teamRate = yearly ? tier.yearly : tier.monthly;
  const teamTotal = teamRate * seats;
  // What the same team would pay one at a time, so the break has something
  // to be measured against.
  const atSoloRate = soloRate * seats;

  return (
    <>
      <div className="mt-8 flex justify-center">
        <Toggle yearly={yearly} onChange={setYearly} />
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl items-start gap-5 md:grid-cols-2">
        {/* ---------------------------------------------------------- solo */}
        <div className="rounded-2xl border-2 border-[var(--rule)] bg-white p-7 text-left">
          <h3 className="text-xl font-bold text-[var(--ink)]">{SOLO.name}</h3>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">{SOLO.who}</p>

          <p className="mt-6 flex items-baseline gap-2">
            <span className="text-5xl font-extrabold tracking-tight text-[var(--ink)]">
              ${soloRate}
            </span>
            <span className="text-[15px] text-[var(--ink-soft)]">
              per {period}
            </span>
          </p>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            {yearly ? `$${SOLO.monthly} a month, billed yearly` : "One person"}
          </p>

          <StartFree />
        </div>

        {/* ---------------------------------------------------------- team */}
        <div className="relative rounded-2xl border-2 border-[var(--brand)] bg-white p-7 text-left shadow-[0_18px_46px_-18px_rgba(241,101,34,0.45)]">
          <span className="absolute -top-3 left-7 rounded-full bg-[var(--brand)] px-3 py-1 text-xs font-bold text-white">
            Cheaper per person
          </span>

          <h3 className="text-xl font-bold text-[var(--ink)]">{TEAM_NAME}</h3>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">{TEAM_WHO}</p>

          <p className="mt-6 flex items-baseline gap-2">
            <span className="text-5xl font-extrabold tracking-tight text-[var(--ink)]">
              ${teamRate}
            </span>
            <span className="text-[15px] text-[var(--ink-soft)]">
              per person, per {period}
            </span>
          </p>

          <div className="mt-5 rounded-xl bg-[var(--surface-alt)] p-4">
            <p className="text-center text-sm font-semibold text-[var(--ink)]">
              How many people?
            </p>

            <div className="mt-2.5 flex items-center justify-center gap-4">
              <button
                type="button"
                aria-label="One fewer"
                onClick={() => setSeats((s) => Math.max(TEAM_MIN, s - 1))}
                disabled={seats <= TEAM_MIN}
                className="flex size-9 items-center justify-center rounded-full border border-[var(--rule)] bg-white transition-colors hover:bg-slate-50 disabled:opacity-40"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-12 text-center text-3xl font-extrabold text-[var(--ink)]">
                {seats}
              </span>
              <button
                type="button"
                aria-label="One more"
                onClick={() => setSeats((s) => Math.min(50, s + 1))}
                className="flex size-9 items-center justify-center rounded-full border border-[var(--rule)] bg-white transition-colors hover:bg-slate-50"
              >
                <Plus className="size-4" />
              </button>
            </div>

            <p className="mt-3 text-center">
              <span className="text-3xl font-extrabold text-[var(--ink)]">
                ${teamTotal.toLocaleString()}
              </span>
              <span className="ml-1.5 text-sm text-[var(--ink-soft)]">
                a {period}
              </span>
            </p>

            {atSoloRate > teamTotal && (
              <p className="mt-1 text-center text-xs">
                <span className="text-[var(--ink-muted)] line-through">
                  ${atSoloRate.toLocaleString()}
                </span>
                <span className="ml-2 font-bold text-[var(--brand)]">
                  You keep ${(atSoloRate - teamTotal).toLocaleString()} a{" "}
                  {period}
                </span>
              </p>
            )}

            {/* The ladder, so the next break is visible before they hit it. */}
            <ul className="mt-4 flex flex-col gap-1 border-t border-[var(--rule)] pt-3">
              {TEAM_TIERS.map((t) => {
                const active = t.min === tier.min;
                return (
                  <li
                    key={t.min}
                    className={`flex items-center justify-between text-xs ${
                      active
                        ? "font-bold text-[var(--ink)]"
                        : "text-[var(--ink-muted)]"
                    }`}
                  >
                    <span>{tierLabel(t)} people</span>
                    <span>
                      ${yearly ? t.yearly : t.monthly} each
                      {active && (
                        <span className="ml-1.5 text-[var(--brand)]">
                          you
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <p className="mt-3 text-center text-xs text-[var(--ink-muted)]">
            One bill for the whole team. Add or remove people any time and the
            bill follows.
          </p>

          <StartFree featured />
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-[var(--rule)] bg-white p-7 text-left">
        <p className="text-center text-[17px] font-semibold text-[var(--ink)]">
          Both come with all of it. There is no upgrade that unlocks the good
          bit.
        </p>
        <ul className="mt-6 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
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
