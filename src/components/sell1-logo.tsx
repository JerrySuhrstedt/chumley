/**
 * The Sell1 wordmark.
 *
 * PLACEHOLDER. The previous mark was hand-drawn letterforms exported from
 * Illustrator. This is set type standing in until a real one is drawn, so
 * nothing on the site ships the old brand. It follows the same visual logic:
 * the distinctive character carries the brand orange, and the period closes
 * the mark.
 *
 * Sized by font-size so it scales with whatever class you hand it.
 */
export function Sell1Logo({
  variant = "dark",
  className = "text-2xl",
}: {
  variant?: "dark" | "light";
  className?: string;
}) {
  const ink = variant === "light" ? "text-white" : "text-[#231f20]";

  return (
    <span
      className={`inline-flex items-baseline font-bold tracking-[-0.03em] ${ink} ${className}`}
      aria-label="Sell1"
      role="img"
    >
      <span aria-hidden>sell</span>
      <span aria-hidden className="text-[var(--brand)]">
        1
      </span>
      <span aria-hidden className="text-[var(--brand)]">
        .
      </span>
    </span>
  );
}
