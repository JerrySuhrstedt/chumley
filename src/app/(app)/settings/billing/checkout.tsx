"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { Loader2 } from "lucide-react";
import { subscriptionLanded } from "./actions";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { priceFor } from "@/lib/paddle/catalog";
import { PRICE, TRIAL_DAYS } from "@/app/(marketing)/pricing/plans";

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
  /** A price negotiated for this team; when set it replaces the flat price. */
  customPriceId: string | null;
  customPriceCents: number | null;
}) {
  const router = useRouter();
  const paddleRef = useRef<Paddle | null>(null);
  const [ready, setReady] = useState(false);
  /** Set between the payment succeeding and the webhook landing. */
  const [settling, setSettling] = useState(false);
  const [slow, setSlow] = useState(false);
  const [seats, setSeats] = useState(Math.max(1, membersNow));

  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;

  /**
   * Poll until the webhook lands, then re-render the page from the server.
   *
   * Measured at three to four seconds in the live test, so a fixed delay
   * would be either a guess that is too short or a wait that is too long.
   * After eight seconds it says so rather than spinning silently, and after
   * thirty it refreshes anyway: the payment did succeed, and a page showing
   * the truth late beats a spinner that never stops.
   */
  const waitForSubscription = useCallback(async () => {
    const started = Date.now();
    const slowAt = setTimeout(() => setSlow(true), 8000);
    try {
      while (Date.now() - started < 30000) {
        const { ready: landed } = await subscriptionLanded();
        if (landed) break;
        await new Promise((r) => setTimeout(r, 1500));
      }
    } finally {
      clearTimeout(slowAt);
      router.refresh();
    }
  }, [router]);

  useEffect(() => {
    if (!token) return;
    initializePaddle({
      token,
      environment:
        process.env.NEXT_PUBLIC_PADDLE_ENV === "production"
          ? "production"
          : "sandbox",
      /**
       * Paddle hands control back the moment payment succeeds, but the
       * subscription does not exist here until its webhook has been
       * delivered and processed. Without this the buyer lands back on the
       * page that still offers them the plan they just bought, which reads
       * as the payment having failed.
       */
      eventCallback: (event) => {
        if (event.name !== "checkout.completed") return;
        setSettling(true);
        paddleRef.current?.Checkout.close();
        void waitForSubscription();
      },
    })
      .then((p) => {
        paddleRef.current = p ?? null;
        setReady(Boolean(p));
      })
      .catch(() => setReady(false));
  }, [token, waitForSubscription]);

  if (!token) return null;

  const custom = customPriceId !== null && customPriceCents !== null;
  // Flat pricing: one rate for every seat, negotiated prices excepted.
  const rate = custom ? customPriceCents / 100 : PRICE;
  const total = rate * seats;
  const period = "month";

  const step = (by: number) => {
    setSeats((s) => Math.max(1, Math.min(200, s + by)));
  };

  const open = () => {
    paddleRef.current?.Checkout.open({
      items: [
        {
          priceId: custom ? customPriceId : priceFor(),
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

  if (settling) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5">
        <Loader2 className="mt-0.5 size-5 shrink-0 animate-spin text-[var(--brand)]" />
        <div>
          <p className="font-medium text-slate-900">
            Payment received. Setting up your subscription...
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {slow
              ? "Taking longer than usual. Your payment went through, so nothing is lost. This page will update by itself."
              : "This takes a few seconds. You do not need to do anything."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5">
      <div>
        <p className="font-medium text-slate-900">Start your subscription</p>
        <p className="mt-1 text-sm text-slate-600">
          {TRIAL_DAYS} days free. Nothing is charged until the trial ends, and
          you can cancel in one click before then.
        </p>
      </div>

      {/* One flat price needs no toggle; a negotiated one is shown as
          the single number somebody agreed to. */}
      <p className="self-start rounded-full bg-[var(--brand-tint)] px-3 py-1.5 text-sm font-semibold text-[var(--brand-dark)]">
        ${custom ? (customPriceCents! / 100).toFixed(2) : PRICE} per person, per month
      </p>

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
        {seats > 1 && ` · $${rate} each`}
      </p>

      <Button onClick={open} disabled={!ready} size="lg">
        {ready ? `Start ${TRIAL_DAYS} days free` : "Loading checkout..."}
      </Button>
    </div>
  );
}
