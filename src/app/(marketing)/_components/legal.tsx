import type { ReactNode } from "react";

/** Last substantive revision. Update when the text changes, not on deploy. */
export const LEGAL_EFFECTIVE_DATE = "August 18, 2026";

export const COMPANY = {
  legalName: "SumoLab LLC",
  product: "UnCRM",
  email: "info@sumolab.co",
  phone: "(480) 826-9400",
  phoneHref: "+14808269400",
  state: "Arizona",
} as const;

export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-3xl px-5 py-16 lg:px-8 lg:py-24">
        <h1 className="text-4xl font-extrabold tracking-tight text-[var(--ink)]">
          {title}
        </h1>
        <p className="mt-3 text-sm text-[var(--ink-muted)]">
          Effective {LEGAL_EFFECTIVE_DATE}
        </p>
        <p className="mt-6 max-w-[68ch] text-[17px] leading-relaxed text-[var(--ink-soft)]">
          {intro}
        </p>
        <div className="mt-10 flex flex-col gap-9">{children}</div>
      </div>
    </div>
  );
}

export function Section({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-bold text-[var(--ink)]">{heading}</h2>
      <div className="mt-3 flex flex-col gap-3 text-[16px] leading-relaxed text-[var(--ink-soft)] [&_a]:font-medium [&_a]:text-[var(--brand)] [&_a:hover]:underline [&_strong]:font-semibold [&_strong]:text-[var(--ink)]">
        {children}
      </div>
    </section>
  );
}

export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-[var(--brand)]">
      {items.map((item, i) => (
        <li key={i} className="pl-1">
          {item}
        </li>
      ))}
    </ul>
  );
}

export function DataTable({
  head,
  rows,
}: {
  head: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--rule)]">
      <table className="w-full min-w-[36rem] border-collapse text-left text-[15px]">
        <thead>
          <tr className="bg-[var(--surface-alt)]">
            {head.map((h) => (
              <th
                key={h}
                className="px-4 py-3 font-semibold text-[var(--ink)]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-[var(--rule)] align-top">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-[var(--ink-soft)]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ContactBlock() {
  return (
    <address className="rounded-xl border border-[var(--rule)] bg-[var(--surface-alt)] p-5 not-italic">
      <p className="font-semibold text-[var(--ink)]">{COMPANY.legalName}</p>
      <p className="mt-1 text-[15px] text-[var(--ink-soft)]">
        {COMPANY.state}, United States
      </p>
      <p className="mt-2 text-[15px]">
        <a
          href={`mailto:${COMPANY.email}`}
          className="font-medium text-[var(--brand)] hover:underline"
        >
          {COMPANY.email}
        </a>
      </p>
      <p className="text-[15px]">
        <a
          href={`tel:${COMPANY.phoneHref}`}
          className="font-medium text-[var(--brand)] hover:underline"
        >
          {COMPANY.phone}
        </a>
      </p>
    </address>
  );
}
