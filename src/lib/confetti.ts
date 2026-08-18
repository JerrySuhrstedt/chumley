import confetti from "canvas-confetti";

/**
 * Celebration for closing a deal. Two angled bursts from the lower corners
 * read as a bigger moment than a single centre pop.
 *
 * Skipped when the visitor asks for reduced motion.
 */
export function fireConfetti() {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const shared: confetti.Options = {
    particleCount: 90,
    spread: 80,
    // Launched hard enough to clear the top of the page, with a slower
    // fall and longer life so the arc is visible the whole way up.
    startVelocity: 90,
    gravity: 0.75,
    ticks: 400,
    scalar: 1.1,
    zIndex: 100,
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
}
