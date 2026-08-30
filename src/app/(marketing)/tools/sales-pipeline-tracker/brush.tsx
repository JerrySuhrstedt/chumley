/**
 * A hand-painted underline for a single word.
 *
 * Drawn as a filled shape rather than a stroked line, because a stroke has
 * one width for its whole length and a brush does not. The outline runs
 * left to right along the top and back along the bottom, and the two edges
 * meet at both ends, so the stroke tapers to nothing where the brush landed
 * and where it lifted off. The bulge sits left of centre, which is where
 * pressure actually peaks in a real stroke.
 *
 * The second, thinner mark is the flick of a stray bristle running past the
 * end. It is the detail that stops this reading as a geometric swoosh.
 *
 * The -0.26em offset is measured, not guessed. The span's bottom edge sits
 * well under the baseline because of line-height, so anchoring there puts
 * the stroke through the letters. Pushing it down by roughly a quarter of
 * the font size clears the baseline and leaves about two pixels of air.
 *
 * preserveAspectRatio="none" lets the same path stretch to whatever the
 * word measures. Distortion is invisible on a shape this organic, and the
 * alternative is a stroke that only fits one word at one screen width.
 */
export function Brush({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block whitespace-nowrap text-[var(--brand)]">
      {children}
      <svg
        viewBox="0 0 200 16"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
        className="pointer-events-none absolute -bottom-[0.2em] left-[-4%] h-[0.34em] w-[108%] overflow-visible"
      >
        {/* The stroke. Both edges meet at the left, so it starts at nothing
            and swells, the way a brush does when it lands. */}
        <path
          d="M1.6,12.2
             C20,6.9 52,3.6 96,2.6
             C136,1.7 170,2.4 198.4,0.5
             C178,7.6 148,9.4 110,10.2
             C73,11 36,11.3 1.6,12.2 Z"
          fill="currentColor"
        />
        {/* A bristle running on past the end. The detail that stops this
            reading as a geometric swoosh. */}
        <path
          d="M150,13.1 C166,12.2 182,10.2 198,7.6 C183,12.4 167,14.6 150.6,15.1 Z"
          fill="currentColor"
          opacity="0.6"
        />
      </svg>
    </span>
  );
}
