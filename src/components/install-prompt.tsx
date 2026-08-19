"use client";

import { useEffect, useState } from "react";
import { Share, X } from "lucide-react";
import { Sell1Logo } from "@/components/sell1-logo";

/** Chromium fires this so a site can offer its own install button. */
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED = "sell1:install-dismissed";

function isIos() {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS reports itself as a Mac, with a touch screen.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari's own flag, which predates the standard.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/**
 * Offers to put Sell1 on the home screen.
 *
 * Two different jobs, because the platforms are not equal. Chromium hands
 * over a real prompt we can fire from a button. Safari does not implement
 * that API at all and never has, so on an iPhone the only thing any website
 * can do is explain where the button is. This shows a button where a button
 * exists and directions where it does not.
 */
export function InstallPrompt() {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISSED)) return;

    if (isIos()) {
      // Nothing to wait for; Safari will never announce itself.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- platform check on mount
      setShowIosHint(true);
      return;
    }

    function onPrompt(e: Event) {
      // Stop the browser's own mini-infobar so ours is the only one.
      e.preventDefault();
      setEvent(e as InstallEvent);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED, "1");
    setEvent(null);
    setShowIosHint(false);
  }

  async function install() {
    if (!event) return;
    await event.prompt();
    await event.userChoice;
    // Either way the question has been asked and should not repeat.
    dismiss();
  }

  if (!event && !showIosHint) return null;

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
                onClick={install}
                className="mt-3 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-bold transition-colors hover:bg-[var(--brand-dark)]"
              >
                Add it
              </button>
            </>
          ) : (
            <p className="mt-1 flex flex-wrap items-center gap-1 text-xs leading-relaxed text-white/80">
              Tap
              <Share className="inline size-3.5 shrink-0" />
              at the bottom of Safari, then
              <strong className="font-semibold text-white">
                Add to Home Screen
              </strong>
              .
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
