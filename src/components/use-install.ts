"use client";

import { useEffect, useState } from "react";

/** Chromium fires this so a site can offer its own install button. */
export type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __chumleyInstall?: InstallEvent | null;
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

/**
 * Which iOS browser this is.
 *
 * It matters because none of them put "Add to Home Screen" in the same
 * place, and every one of them is WebKit underneath so the usual engine
 * sniffing tells you nothing. Chrome and Edge hide it behind a menu at
 * the bottom right; Safari keeps it beside the address bar or under
 * Share. Naming the wrong control reads as the feature being broken.
 */
export type IosBrowser = "safari" | "chrome" | "edge" | "firefox" | "other";

export function iosBrowser(): IosBrowser {
  if (typeof navigator === "undefined") return "safari";
  const ua = navigator.userAgent;
  if (/CriOS/.test(ua)) return "chrome";
  if (/EdgiOS/.test(ua)) return "edge";
  if (/FxiOS/.test(ua)) return "firefox";
  if (/Safari/.test(ua)) return "safari";
  return "other";
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
  /** Which iOS browser, so the directions name the right control. */
  browser: IosBrowser;
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
    browser: "safari",
    installed: false,
    ready: false,
  });

  useEffect(() => {
    const settle = () =>
      setState({
        event: window.__chumleyInstall ?? null,
        ios: isIos(),
        browser: iosBrowser(),
        installed: isStandalone(),
        ready: true,
      });

    settle();
    window.addEventListener("chumley:installable", settle);
    window.addEventListener("chumley:installed", settle);
    return () => {
      window.removeEventListener("chumley:installable", settle);
      window.removeEventListener("chumley:installed", settle);
    };
  }, []);

  return state;
}

/** Fires Chromium's install dialog. Resolves once the user has answered. */
export async function runInstall(event: InstallEvent) {
  await event.prompt();
  const choice = await event.userChoice;
  if (choice.outcome === "accepted") window.__chumleyInstall = null;
  return choice.outcome;
}
