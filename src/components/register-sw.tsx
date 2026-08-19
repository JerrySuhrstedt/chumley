"use client";

import { useEffect } from "react";

/** Registers the worker that makes the app installable. See public/sw.js. */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // After hydration, so it never competes with the first paint.
    const id = setTimeout(() => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installability is a nicety; the app works regardless.
      });
    }, 1000);
    return () => clearTimeout(id);
  }, []);

  return null;
}
