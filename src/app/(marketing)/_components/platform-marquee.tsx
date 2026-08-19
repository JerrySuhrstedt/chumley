import {
  AppWindow,
  Compass,
  Globe,
  Laptop,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";

/**
 * Where Sell1 runs.
 *
 * Deliberately device shapes and plain product names rather than the
 * companies' own logos. Apple, Google and Microsoft all restrict use of
 * their marks, and naming a product in text to describe compatibility is
 * the route that needs nobody's permission. It also looks better than a
 * row of borrowed logos in six different styles.
 */
const PLATFORMS = [
  { label: "iPhone", icon: Smartphone },
  { label: "iPad", icon: Tablet },
  { label: "Android", icon: Smartphone },
  { label: "Mac", icon: Laptop },
  { label: "Windows", icon: Monitor },
  { label: "Chromebook", icon: Laptop },
  { label: "Chrome", icon: Globe },
  { label: "Safari", icon: Compass },
  { label: "Edge", icon: AppWindow },
  { label: "Firefox", icon: Globe },
];

function Row({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <ul
      aria-hidden={ariaHidden || undefined}
      className="flex shrink-0 items-center gap-10 pr-10"
    >
      {PLATFORMS.map((p) => (
        <li
          key={p.label}
          className="flex shrink-0 items-center gap-2.5 text-[var(--ink-soft)]"
        >
          <p.icon className="size-6 shrink-0" strokeWidth={1.6} />
          <span className="text-lg font-semibold whitespace-nowrap">
            {p.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function PlatformMarquee() {
  return (
    <section className="border-y border-[var(--rule)] bg-white py-14">
      <div className="mx-auto max-w-6xl px-5 text-center lg:px-8">
        <h2 className="text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-3xl">
          Works on whatever you already carry
        </h2>
        <p className="mx-auto mt-3 max-w-[52ch] text-[17px] text-[var(--ink-soft)]">
          Add it to your home screen and it opens like an app. Nothing to
          download, nothing to update, no app store.
        </p>
      </div>

      {/* Faded at both ends so the loop has no visible seam. */}
      <div
        className="relative mt-10 overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        }}
      >
        {/* Two identical rows: when the first has slid a full width, the
            second is exactly where it started and the loop is seamless. */}
        <div className="flex w-max animate-[marquee_38s_linear_infinite] motion-reduce:animate-none">
          <Row />
          <Row ariaHidden />
        </div>
      </div>
    </section>
  );
}
