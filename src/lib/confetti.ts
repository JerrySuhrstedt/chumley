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
    particleCount: 70,
    spread: 70,
    startVelocity: 45,
    ticks: 220,
    zIndex: 100,
    colors: ["#0079bf", "#61bd4f", "#f2d600", "#ff9f1a", "#ffffff"],
  };

  confetti({ ...shared, angle: 60, origin: { x: 0.1, y: 0.9 } });
  confetti({ ...shared, angle: 120, origin: { x: 0.9, y: 0.9 } });
}
