"use client";

import type { IosBrowser } from "@/components/use-install";

/**
 * How to add Sell1 to the home screen on an iPhone.
 *
 * Every iOS browser is WebKit underneath and none of them agree on where
 * this lives. Chrome and Edge put it behind a menu at the bottom right,
 * Safari beside the address bar or under Share, Firefox behind its own
 * menu. Pointing at a control that is not on the reader's screen makes a
 * working feature look broken, which is exactly what happened here, so
 * each one is named separately rather than approximated.
 */
const STEPS: Record<IosBrowser, string[][]> = {
  chrome: [
    ["Tap the", "•••", "button at the bottom right of Chrome."],
    ["Choose", "Add to Home Screen", "from the menu."],
    ["Tap", "Add", "."],
  ],
  edge: [
    ["Tap the", "•••", "button at the bottom of Edge."],
    ["Choose", "Add to Phone", "or", "Add to Home Screen", "."],
    ["Tap", "Add", "."],
  ],
  firefox: [
    ["Tap the", "•••", "menu in Firefox."],
    ["Choose", "Share", ", then", "Add to Home Screen", "."],
    ["Tap", "Add", "."],
  ],
  safari: [
    ["Tap the", "share", "button. It is the square with an arrow, either beside the address bar or at the bottom."],
    ["Scroll down and choose", "Add to Home Screen", "."],
    ["Tap", "Add", "."],
  ],
  other: [
    ["Open your browser's", "menu", "."],
    ["Look for", "Add to Home Screen", ", sometimes under Share."],
    ["Tap", "Add", "."],
  ],
};

export function IosSteps({
  browser = "safari",
  tone = "light",
}: {
  browser?: IosBrowser;
  tone?: "light" | "dark";
}) {
  const muted = tone === "dark" ? "text-white/75" : "text-slate-500";
  const strong = tone === "dark" ? "text-white" : "text-slate-900";

  return (
    <ol className={`mt-1.5 flex flex-col gap-1 text-xs leading-relaxed ${muted}`}>
      {STEPS[browser].map((parts, i) => (
        <li key={i}>
          {i + 1}.{" "}
          {parts.map((part, j) =>
            // Odd positions are the thing to tap, so they carry the weight.
            j % 2 === 1 ? (
              <strong key={j} className={`font-semibold ${strong}`}>
                {part}
              </strong>
            ) : (
              <span key={j}>{part}</span>
            )
          )}
        </li>
      ))}
    </ol>
  );
}
