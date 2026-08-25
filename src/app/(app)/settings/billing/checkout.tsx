"use client";

import { useEffect, useRef, useState } from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { priceFor } from "@/lib/paddle/catalog";
import {
  SOLO,
  TEAM_MIN,
  TRIAL_DAYS,
  tierFor,
} from "@/app/(marketing)/pricing/plans";

/**
 * The checkout, opened as a Paddle overlay over our own page.
 *
 * It lives in the app rather than on the public pricing page for one
 * reason: the webhook matches a payment back to a team by the orgId we
 * attach here, and there is no org until somebody has signed in. Matching
 * on email instead would break the moment a rep pays with a different
 * address from the one they signed up with, which is common.
 */
export function Checkout({
  orgId,
  email,
  membersNow,
  customPriceId,
  customPriceCents,
}: {
  orgId: string;
  email: string;
  /** Seats cannot be bought below the headcount already in the team. */
  membersNow: number;
  /**
   * A price negotiated for this team. When set it replaces the ladder
   * entirely, and the yearly toggle goes with it: a bespoke price is a
   * monthly number somebody agreed to, not a second ladder to climb.
   */
  customPriceId: string | null;
  customPriceCents: number | null;
}) {
  const paddleRef = useRef<Paddle | null>(null);
  const [ready, setReady] = useState(false);
  const [yearly, setYearly] = useState(false);
  const [seats, setSeats] = useState(Math.max(1, membersNow));

  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;

  useEffect(() => {
    if (!token) return;
    initializePaddle({
      token,
      environment:
        process.env.NEXT_PUBLIC_PADDLE_ENV === "production"
          ? "production"
          : "sandbox",
    })
      .then((p) => {
        paddleRef.current = p ?? null;
        setReady(Boolean(p));
      })
      .catch(() => setReady(false));
  }, [token]);

  if (!token) return null;

  const custom = customPriceId !== null && customPriceCents !== null;
  const solo = seats <= 1;
  const rate = custom
    ? customPriceCents / 100
    : solo
      ? yearly
        ? SOLO.yearly
        : SOLO.monthly
      : yearly
        ? tierFor(seats).yearly
        : tierFor(seats).monthly;
  const total = rate * seats;
  const period = custom ? "month" : yearly ? "year" : "month";

  // Below the team minimum there is no team price, so the stepper skips the
  // gap rather than showing a number nobody can buy.
  const step = (by: number) => {
    setSeats((s) => {
      const next = s + by;
      if (next < 1) return 1;
      if (next > 1 && next < TEAM_MIN) return by > 0 ? TEAM_MIN : 1;
      return Math.min(200, next);
    });
  };

  const open = () => {
    paddleRef.current?.Checkout.open({
      items: [
        {
          priceId: custom ? customPriceId : priceFor(seats, yearly),
          quantity: seats,
        },
      ],
      customer: { email },
      // How the webhook finds this team. Without it a paid subscription
      // arrives with nowhere to put it.
      customData: { orgId },
      settings: {
        displayMode: "overlay",
        theme: "light",
        successUrl: `${window.location.origin}/settings/billing?welcome=1`,
      },
    });
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5">
      <div>
        <p className="font-medium text-slate-900">Start your subscription</p>
        <p className="mt-1 text-sm text-slate-600">
          {TRIAL_DAYS} days free. Nothing is charged until the trial ends, and
          you can cancel in one click before then.
        </p>
      </div>

      {custom ? (
        // No toggle. A negotiated price is one monthly number somebody
        // agreed to, and offering a yearly variant of it would be offering
        // a price that does not exist.
        <p className="self-start rounded-full bg-violet-50 px-3 py-1.5 text-sm font-semibold text-violet-800">
          Your price: ${(customPriceCents! / 100).toFixed(2)} per person, per month
        </p>
      ) : (
        <div className="inline-flex self-start rounded-full bg-slate-100 p-1">
          {([false, true] as const).map((opt) => (
            <button
              key={String(opt)}
              type="button"
              onClick={() => setYearly(opt)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                yearly === opt
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              {opt ? "Yearly" : "Monthly"}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            How many people?
          </p>
          <p className="text-xs text-slate-500">
            {membersNow > 1
              ? `${membersNow} on the team right now`
              : "Just you for now"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="One fewer"
            onClick={() => step(-1)}
            disabled={seats <= Math.max(1, membersNow)}
            className="flex size-8 items-center justify-center rounded-full border border-slate-200 bg-white disabled:opacity-40"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-8 text-center text-2xl font-bold text-slate-900">
            {seats}
          </span>
          <button
            type="button"
            aria-label="One more"
            onClick={() => step(1)}
            className="flex size-8 items-center justify-center rounded-full border border-slate-200 bg-white"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <p className="text-sm text-slate-600">
        <span className="text-2xl font-bold text-slate-900">
          ${total.toLocaleString()}
        </span>{" "}
        a {period}
        {!solo && ` · $${rate} each`}
      </p>

      <Button onClick={open} disabled={!ready} size="lg">
        {ready ? `Start ${TRIAL_DAYS} days free` : "Loading checkout..."}
      </Button>
    </div>
  );
}
