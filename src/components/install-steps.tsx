"use client";

/**
 * How to add to the home screen on an iPhone.
 *
 * Worth being fussy about the wording. Safari has moved this control: on
 * current iOS the address bar sits at the bottom with a menu button beside
 * it and Share lives inside that menu, while older layouts put Share on
 * the toolbar directly. Naming only one of them sends half of readers
 * hunting for an icon that is not on their screen, which reads as the
 * feature being broken rather than the instructions being stale.
 */
export function IosSteps({ tone = "light" }: { tone?: "light" | "dark" }) {
  const muted = tone === "dark" ? "text-white/75" : "text-slate-500";
  const strong = tone === "dark" ? "text-white" : "text-slate-900";

  return (
    <ol className={`mt-1.5 flex flex-col gap-1 text-xs leading-relaxed ${muted}`}>
      <li>
        1. Tap the <strong className={`font-semibold ${strong}`}>menu</strong>{" "}
        button beside the address bar. It looks like{" "}
        <strong className={`font-semibold ${strong}`}>☰</strong> or{" "}
        <strong className={`font-semibold ${strong}`}>aA</strong>. On older
        iPhones, tap the Share button instead.
      </li>
      <li>
        2. Choose{" "}
        <strong className={`font-semibold ${strong}`}>Add to Home Screen</strong>
        . You may need to scroll the menu, or tap Share first.
      </li>
      <li>
        3. Tap <strong className={`font-semibold ${strong}`}>Add</strong>.
      </li>
    </ol>
  );
}
