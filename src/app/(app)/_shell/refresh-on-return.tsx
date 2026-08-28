"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Re-fetch the page's server data when the person comes back to it, and
 * gently while they sit on it.
 *
 * A manager hands a deal to a rep; the rep's board was already open and
 * showed the old owner until a manual reload. True push realtime is a
 * websocket build this app does not need yet, but two cheap triggers
 * cover nearly every real case: returning to the tab (refresh at once)
 * and simply having it open (refresh every 45 seconds while visible).
 * Throttled so tab-switching sprees do not hammer the server, and
 * router.refresh preserves client state, so nothing visibly jumps.
 */
export function RefreshOnReturn() {
  const router = useRouter();
  const last = useRef(0);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - last.current < 15_000) return;
      last.current = now;
      router.refresh();
    };

    const onVisible = () => refresh();
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    const tick = setInterval(refresh, 45_000);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(tick);
    };
  }, [router]);

  return null;
}
