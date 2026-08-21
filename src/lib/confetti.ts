import confetti from "canvas-confetti";

/** Whether this device wants animation kept to a minimum. */
export function motionAllowed() {
  if (typeof window === "undefined") return false;
  return !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Celebration for closing a deal. Two angled bursts from the lower corners
 * read as a bigger moment than a single centre pop.
 *
 * Returns whether it actually fired, so the caller can say something
 * instead when it did not. Reduced motion is a real preference and is
 * honoured, but iOS also forces it on in Low Power Mode, which meant a
 * won deal could pass in complete silence for reasons nobody chose.
 */
export function fireConfetti(): boolean {
  if (typeof window === "undefined") return false;
  if (!motionAllowed()) return false;

  const shared: confetti.Options = {
    particleCount: 90,
    spread: 80,
    // Launched hard enough to clear the top of the page, with a slower
    // fall and longer life so the arc is visible the whole way up.
    startVelocity: 90,
    gravity: 0.75,
    ticks: 400,
    scalar: 1.1,
    zIndex: 2147483000,
    colors: ["#0079bf", "#61bd4f", "#f2d600", "#ff9f1a", "#ffffff"],
  };

  confetti({ ...shared, angle: 65, origin: { x: 0.1, y: 1 } });
  confetti({ ...shared, angle: 115, origin: { x: 0.9, y: 1 } });

  // A centre burst a beat later carries the peak higher still.
  setTimeout(() => {
    confetti({
      ...shared,
      particleCount: 70,
      angle: 90,
      spread: 110,
      startVelocity: 100,
      origin: { x: 0.5, y: 1 },
    });
  }, 130);

  return true;
}
