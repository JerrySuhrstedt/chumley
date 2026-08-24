"use client";

import { Share } from "lucide-react";
import type { IosBrowser } from "@/components/use-install";

/**
 * How to add Chumley to the home screen on an iPhone.
 *
 * Every iOS browser ends in the same place, the system share sheet, with
 * "Add to Home Screen" some way down it. The only thing that differs is
 * where the Share button lives, so that is the only thing worth varying.
 * Earlier versions of this pointed at browser menus instead and sent
 * people hunting for controls that were not on their screen.
 *
 * The share glyph is drawn inline rather than described, because "the
 * square with an arrow coming out of it" is a lot of words for something
 * a reader can simply be shown.
 */
const WHERE: Record<IosBrowser, string> = {
  chrome: "at the right-hand end of the address bar, up at the top",
  edge: "in the toolbar at the bottom",
  firefox: "in the menu, under the three dots",
  safari: "in the toolbar at the bottom, or beside the address bar",
  other: "in your browser's toolbar or menu",
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
  const bold = `font-semibold ${strong}`;

  return (
    <ol className={`mt-1.5 flex flex-col gap-1.5 text-xs leading-relaxed ${muted}`}>
      <li>
        1. Tap the <strong className={bold}>Share</strong> button
        <Share className={`mx-1 inline size-3.5 shrink-0 ${strong}`} />
        {WHERE[browser]}.
      </li>
      <li>
        2. <strong className={bold}>Scroll down</strong> the list that opens.
        It is a long way down, past Copy, Bookmarks and Print.
      </li>
      <li>
        3. Tap <strong className={bold}>Add to Home Screen</strong>, then{" "}
        <strong className={bold}>Add</strong>.
      </li>
    </ol>
  );
}
