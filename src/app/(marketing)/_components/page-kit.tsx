import Link from "next/link";
import { Check, X, ChevronRight } from "lucide-react";
import { CtaButton } from "./cta";
import { TRIAL_DAYS } from "../pricing/plans";

/**
 * Shared building blocks for the marketing subpages: comparison pages, the
 * use-case and vertical pages, and the guides. Keeping them here means every
 * new page inherits the same hero, spacing, and closing call to action, so
 * the site reads as one thing rather than fifteen one-offs.
 */

export function Breadcrumbs({
  crumbs,
}: {
  crumbs: { name: string; path: string }[];
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mx-auto flex max-w-3xl flex-wrap items-center gap-1.5 px-5 pt-8 text-sm text-[var(--ink-muted)]"
    >
      {crumbs.map((c, i) => (
        <span key={c.path} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="size-3.5 opacity-60" />}
          {i < crumbs.length - 1 ? (
            <Link href={c.path} className="hover:text-[var(--brand)]">
              {c.name}
            </Link>
          ) : (
            <span className="font-medium text-[var(--ink-soft)]">{c.name}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function PageHero({
  eyebrow,
  title,
  sub,
  cta = true,
  eyebrowLarge = false,
  titleLarge = false,
}: {
  eyebrow?: string;
  /**
   * ReactNode rather than string, so a page can emphasise one word inside
   * its own headline. Every existing caller passes a string and is
   * unaffected, because a string is already a ReactNode.
   */
  title: React.ReactNode;
  sub: string;
  cta?: boolean;
  /** Turns the eyebrow into a headline in its own right. Use sparingly. */
  eyebrowLarge?: boolean;
  /** Roughly 30% up on the default. For pages that lead with the headline. */
  titleLarge?: boolean;
}) {
  return (
    <header className="mx-auto max-w-3xl px-5 pt-10 pb-6 text-center sm:pt-14">
      {eyebrow && (
        <p
          className={`font-bold uppercase text-[var(--brand)] ${
            eyebrowLarge
              ? "text-[1.75rem] leading-none tracking-tight"
              : "text-sm tracking-wide"
          }`}
        >
          {eyebrow}
        </p>
      )}
      <h1
        className={`mt-3 leading-[1.05] font-extrabold tracking-tight text-balance text-[var(--ink)] ${
          titleLarge
            ? "text-[3.1rem] sm:text-[3.9rem]"
            : "text-[2.4rem] sm:text-5xl"
        }`}
      >
        {title}
      </h1>
      <p className="mx-auto mt-5 max-w-[52ch] text-lg leading-snug font-medium text-[var(--ink-soft)]">
        {sub}
      </p>
      {cta && (
        <div className="mt-7 flex flex-col items-center gap-2">
          <CtaButton size="lg" />
          <p className="text-sm text-[var(--ink-muted)]">
            {TRIAL_DAYS} days free. No card to start.
          </p>
        </div>
      )}
    </header>
  );
}

export function Section({
  children,
  alt = false,
  className = "",
}: {
  children: React.ReactNode;
  alt?: boolean;
  className?: string;
}) {
  return (
    <section
      className={`${alt ? "bg-[var(--surface-alt)]" : ""} ${className}`}
    >
      <div className="mx-auto max-w-3xl px-5 py-10 sm:py-14">{children}</div>
    </section>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl font-extrabold tracking-tight text-balance text-[var(--ink)] sm:text-3xl">
      {children}
    </h2>
  );
}

/**
 * Long-form article body. Styles the headings, paragraphs and lists that a
 * guide is written in, so a guide page is just prose wrapped in this.
 */
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mx-auto max-w-[68ch] px-5 py-8
        [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-[1.55rem] [&_h2]:font-extrabold [&_h2]:tracking-tight [&_h2]:text-[var(--ink)]
        [&_h3]:mt-7 [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-[var(--ink)]
        [&_p]:my-4 [&_p]:text-[17px] [&_p]:leading-relaxed [&_p]:text-[var(--ink-soft)]
        [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2.5 [&_ul]:marker:text-[var(--brand)]
        [&_li]:pl-1.5 [&_li]:text-[17px] [&_li]:leading-relaxed [&_li]:text-[var(--ink-soft)]
        [&_a]:font-semibold [&_a]:text-[var(--brand)] [&_a:hover]:underline
        [&_strong]:font-bold [&_strong]:text-[var(--ink)]"
    >
      {children}
    </div>
  );
}

export function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <Check className="mt-0.5 size-5 shrink-0 text-[var(--brand)]" />
          <span className="text-[17px] leading-snug text-[var(--ink-soft)]">
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * A head-to-head table. First column is the row label, then one column per
 * product. A boolean renders a check or a cross; a string renders as text.
 */
export function CompareTable({
  columns,
  rows,
  tone = "brand",
}: {
  columns: string[];
  rows: { label: string; values: (boolean | string)[] }[];
  /**
   * "good" paints the ticks green, for a capability matrix where a tick
   * means works rather than ours. Comparison tables keep the brand colour,
   * where the first column is us and a brand tick is the point.
   */
  tone?: "brand" | "good";
}) {
  const tick = tone === "good" ? "text-[#15803d]" : "text-[var(--brand)]";
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-left text-[15px]">
        <thead>
          <tr className="border-b border-[var(--rule)]">
            <th className="py-3 pr-4 font-semibold text-[var(--ink-muted)]"></th>
            {columns.map((c, i) => (
              <th
                key={c}
                className={`px-4 py-3 font-bold ${
                  i === 0 && tone === "brand"
                    ? "text-[var(--brand)]"
                    : "text-[var(--ink)]"
                }`}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-[var(--rule)]">
              <th className="py-3 pr-4 text-left font-semibold text-[var(--ink)]">
                {row.label}
              </th>
              {row.values.map((v, i) => (
                <td key={i} className="px-4 py-3 align-top text-[var(--ink-soft)]">
                  {typeof v === "boolean" ? (
                    v ? (
                      <Check className={`size-5 ${tick}`} aria-label="Yes" />
                    ) : (
                      <X className="size-5 text-[var(--ink-muted)] opacity-50" aria-label="No" />
                    )
                  ) : (
                    v
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CtaClose({
  heading = "Ready to try the simple one?",
  sub,
}: {
  heading?: string;
  sub?: string;
}) {
  return (
    <section className="bg-[var(--brand-tint)]">
      <div className="mx-auto max-w-3xl px-5 py-14 text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-balance text-[var(--ink)] sm:text-3xl">
          {heading}
        </h2>
        {sub && (
          <p className="mx-auto mt-3 max-w-[46ch] text-[var(--ink-soft)]">{sub}</p>
        )}
        <div className="mt-6 flex flex-col items-center gap-2">
          <CtaButton size="lg" />
          <p className="text-sm text-[var(--ink-muted)]">
            {TRIAL_DAYS} days free. No card to start.
          </p>
        </div>
      </div>
    </section>
  );
}

/** A related-links row for internal linking between the new pages. */
export function RelatedLinks({
  links,
}: {
  links: { title: string; path: string }[];
}) {
  return (
    <nav className="mx-auto max-w-3xl px-5 py-10">
      <p className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--ink-muted)]">
        Keep reading
      </p>
      <ul className="flex flex-col divide-y divide-[var(--rule)] rounded-2xl border border-[var(--rule)] bg-white">
        {links.map((l) => (
          <li key={l.path}>
            <Link
              href={l.path}
              className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-[var(--surface-alt)]"
            >
              <span className="font-semibold text-[var(--ink)]">{l.title}</span>
              <ChevronRight className="size-4 shrink-0 text-[var(--ink-muted)]" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
