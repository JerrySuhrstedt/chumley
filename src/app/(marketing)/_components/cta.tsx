import Link from "next/link";

/**
 * One label, one destination, used by the header, the hero and the closing
 * section. The framework is strict about this: the call to action has to be
 * word for word identical everywhere it appears.
 */
export const CTA_LABEL = "Create Your Free Account";
export const CTA_HREF = "/login?mode=signup";

export function CtaButton({
  size = "lg",
  className = "",
}: {
  size?: "lg" | "xl";
  className?: string;
}) {
  const pad = size === "xl" ? "px-9 py-4.5 text-lg" : "px-7 py-3.5 text-base";

  return (
    <Link
      href={CTA_HREF}
      className={`inline-flex items-center justify-center rounded-xl whitespace-nowrap bg-[var(--brand)] font-bold text-white shadow-[0_6px_20px_-6px_rgba(241,101,34,0.7)] transition-all hover:bg-[var(--brand-dark)] hover:shadow-[0_10px_28px_-8px_rgba(241,101,34,0.75)] ${pad} ${className}`}
    >
      {CTA_LABEL}
    </Link>
  );
}
