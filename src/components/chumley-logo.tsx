/**
 * The Chumley wordmark, inlined so it never waits on a network request and
 * can inherit sizing from its container.
 *
 * PLACEHOLDER ARTWORK. The Sell1 version of this file carried vector paths
 * exported from Illustrator that literally drew the letters "sell1." Those
 * are gone. This draws the word as live text instead, so nothing anywhere
 * still shows the old brand. Replace the <text> below with real exported
 * paths when the Chumley wordmark is drawn.
 *
 * The viewBox keeps Sell1's 545x198 ratio on purpose: every caller sizes this
 * with `h-6 w-auto` and friends, so holding the ratio means no layout shifts.
 * The period carries the brand orange, the word flips between ink and white
 * depending on the surface underneath it.
 */
export function ChumleyLogo({
  variant = "dark",
  className = "h-8 w-auto",
}: {
  variant?: "dark" | "light";
  className?: string;
}) {
  const wordColor = variant === "light" ? "#ffffff" : "#221f1f";

  return (
    <svg
      viewBox="0 0 545 198"
      className={className}
      role="img"
      aria-label="Chumley"
      fill="none"
    >
      <text
        x="6"
        y="156"
        textLength="533"
        lengthAdjust="spacingAndGlyphs"
        fontFamily="system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"
        fontSize="172"
        fontWeight="800"
        letterSpacing="-6"
        fill={wordColor}
      >
        Chumley
        <tspan fill="#f16522">.</tspan>
      </text>
    </svg>
  );
}
