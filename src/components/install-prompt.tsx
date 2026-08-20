"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Sell1Logo } from "@/components/sell1-logo";
import { IosSteps } from "@/components/install-steps";
import { runInstall, useInstall } from "@/components/use-install";

const DISMISSED = "sell1:install-dismissed";
/**
 * How long "not now" lasts.
 *
 * It used to be forever, which turned one stray tap into a feature the
 * person could never find again. Two weeks is long enough that it is not
 * nagging and short enough that it is not a dead end. Settings carries the
 * same offer permanently for anyone who wants it sooner.
 */
const QUIET_DAYS = 14;

/**
 * Offers to put Sell1 on the home screen, once.
 *
 * Chromium hands over a real prompt we can fire from a button. Safari has
 * never implemented that API, so on an iPhone the only thing any website
 * can do is say where the button is. That makes the wording load bearing:
 * point at the wrong control and the feature reads as broken.
 *
 * Dismissing this hides it for good, which is why the same offer also
 * lives in Settings where it cannot be lost.
 */
export function InstallPrompt() {
  const { event, ios, browser, installed, ready } = useInstall();
  // Read once, on the first client render. An effect that copies
  // localStorage into state renders twice and flashes the banner at
  // somebody who already dismissed it.
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    const until = Number(localStorage.getItem(DISMISSED) ?? 0);
    return Number.isFinite(until) && until > Date.now();
  });

  function dismiss() {
    const until = Date.now() + QUIET_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISSED, String(until));
    setDismissed(true);
  }

  if (!ready || dismissed || installed) return null;
  if (!event && !ios) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl bg-[var(--deep)] p-4 text-white shadow-[0_18px_40px_-12px_rgba(0,0,0,0.6)]">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Not now"
        className="absolute top-3 right-3 rounded-md p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
      >
        <X className="size-4" />
      </button>

      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white">
          <Sell1Logo className="h-4 w-auto" />
        </span>

        <div className="min-w-0 pr-6">
          <p className="text-sm font-semibold">Put Sell1 on your home screen</p>

          {event ? (
            <>
              <p className="mt-0.5 text-xs text-white/70">
                Opens like an app, no browser bar in the way.
              </p>
              <button
                type="button"
                onClick={async () => {
                  await runInstall(event);
                  dismiss();
                }}
                className="mt-3 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-bold transition-colors hover:bg-[var(--brand-dark)]"
              >
                Add it
              </button>
            </>
          ) : (
            <IosSteps browser={browser} tone="dark" />
          )}
        </div>
      </div>
    </div>
  );
}
