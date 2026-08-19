"use client";

import { useEffect, useState } from "react";

/** Chromium fires this so a site can offer its own install button. */
export type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __sell1Install?: InstallEvent | null;
  }
}

export function isIos() {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS reports itself as a Mac, with a touch screen.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari's own flag, which predates the standard.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export type InstallState = {
  /** Chromium only. Null means no button can be offered. */
  event: InstallEvent | null;
  /** Safari cannot be prompted at all, so it gets directions instead. */
  ios: boolean;
  /** Already on the home screen. Nothing to offer. */
  installed: boolean;
  /** Settled after mount, so nothing renders from a server guess. */
  ready: boolean;
};

/**
 * What, if anything, we can offer this browser.
 *
 * The event is read from the window rather than from a listener alone,
 * because the script in the document head has usually caught it before
 * any component exists. The listener is still here for the first visit,
 * where installability is decided after the service worker registers.
 */
export function useInstall(): InstallState {
  const [state, setState] = useState<InstallState>({
    event: null,
    ios: false,
    installed: false,
    ready: false,
  });

  useEffect(() => {
    const settle = () =>
      setState({
        event: window.__sell1Install ?? null,
        ios: isIos(),
        installed: isStandalone(),
        ready: true,
      });

    settle();
    window.addEventListener("sell1:installable", settle);
    window.addEventListener("sell1:installed", settle);
    return () => {
      window.removeEventListener("sell1:installable", settle);
      window.removeEventListener("sell1:installed", settle);
    };
  }, []);

  return state;
}

/** Fires Chromium's install dialog. Resolves once the user has answered. */
export async function runInstall(event: InstallEvent) {
  await event.prompt();
  const choice = await event.userChoice;
  if (choice.outcome === "accepted") window.__sell1Install = null;
  return choice.outcome;
}
