import type { ReactNode } from "react";

/** Last substantive revision. Update when the text changes, not on deploy. */
export const LEGAL_EFFECTIVE_DATE = "August 24, 2026";

export const COMPANY = {
  legalName: "SumoLab LLC",
  product: "Chumley",
  email: "info@sumolab.co",
  phone: "(480) 826-9400",
  phoneHref: "+14808269400",
  street: "2600 E Springfield Pl",
  city: "Chandler",
  state: "Arizona",
  stateCode: "AZ",
  postal: "85286",
  country: "United States",
} as const;

/**
 * Who the customer is actually buying from.
 *
 * Paddle is the merchant of record, not us, and that has consequences the
 * buyer is entitled to know before they pay: the contract of sale is with
 * Paddle, Paddle handles the tax, and Paddle is the name that shows up on
 * the card statement rather than ours. A charge nobody recognises is the
 * single most common cause of a chargeback, so this text earns its place
 * on the pricing page as much as in the terms.
 */
export const MERCHANT = {
  name: "Paddle.com Market Ltd",
  short: "Paddle",
  statement: "PADDLE.NET",
  href: "https://www.paddle.com/legal/terms",
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

/** The full registered address. Card networks and Paddle both want it. */
export function ContactBlock() {
  return (
    <address className="rounded-xl border border-[var(--rule)] bg-[var(--surface-alt)] p-5 not-italic">
      <p className="font-semibold text-[var(--ink)]">{COMPANY.legalName}</p>
      <p className="mt-1 text-[15px] text-[var(--ink-soft)]">
        {COMPANY.street}
        <br />
        {COMPANY.city}, {COMPANY.stateCode} {COMPANY.postal}
        <br />
        {COMPANY.country}
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

/**
 * The merchant-of-record notice, in one place so the pricing page, the
 * terms and the refund policy cannot drift apart on the detail that
 * decides whether a customer recognises the charge.
 */
export function MerchantNotice({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-xl border border-[var(--rule)] bg-[var(--surface-alt)] p-5 text-left ${className}`}
    >
      <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
        <strong className="font-semibold text-[var(--ink)]">
          Our order process is run by {MERCHANT.short}.
        </strong>{" "}
        {MERCHANT.name} is the merchant of record for every purchase of{" "}
        {COMPANY.product}. {MERCHANT.short} handles the payment, collects any
        sales tax or VAT due in your country, and issues your invoice.{" "}
        <strong className="font-semibold text-[var(--ink)]">
          Your card statement will read {MERCHANT.statement}
        </strong>{" "}
        rather than {COMPANY.legalName}, so it is worth knowing that before it
        arrives.
      </p>
    </div>
  );
}
