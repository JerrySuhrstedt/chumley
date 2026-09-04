import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo/meta";
import { JsonLd, breadcrumbLd } from "@/lib/seo/jsonld";
import { Breadcrumbs, PageHero, Section, H2 } from "../_components/page-kit";
import { COMPANY } from "../_components/legal";
import { ARTICLES, TOPICS } from "./_articles";
import { TicketForm } from "./ticket-form";

/**
 * One support destination, not three.
 *
 * A separate contact page, help centre and status page is the shape a
 * company takes once each of those has enough traffic to deserve its own
 * front door. Before that it just means two of the three always look
 * abandoned. Everything lives here until one section outgrows the page.
 */

export const metadata: Metadata = pageMeta({
  title: "Support and Help Center",
  description:
    "Get help with Chumley. Step by step guides, and a form that reaches a person the same day.",
  path: "/support",
});

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Support", path: "/support" },
];

export default function SupportPage() {
  const groups = TOPICS.map((topic) => ({
    topic,
    items: ARTICLES.filter((a) => a.topic === topic),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      <JsonLd data={breadcrumbLd(CRUMBS)} />

      <Breadcrumbs crumbs={CRUMBS} />
      <PageHero
        eyebrow="Support"
        title="Help, and a person to ask"
        sub="Short guides for the things people actually get stuck on, and a form that reaches a human the same day. No ticket numbers, no phone tree."
      />

      <Section>
        <H2>Guides</H2>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          Each one is about two minutes. They are written the way somebody
          would actually explain it to you, including the part that trips
          everybody up.
        </p>

        <div className="mt-8 flex flex-col gap-10">
          {groups.map((group) => (
            <div key={group.topic}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--brand)]">
                {group.topic}
              </h3>
              <ul className="mt-4 flex flex-col divide-y divide-[var(--rule)] rounded-2xl border border-[var(--rule)] bg-white">
                {group.items.map((a) => (
                  <li key={a.slug}>
                    <Link
                      href={`/support/${a.slug}`}
                      className="flex flex-col gap-1 px-5 py-4 hover:bg-[var(--surface-alt)]"
                    >
                      <span className="flex items-baseline justify-between gap-4">
                        <span className="font-semibold text-[var(--ink)]">
                          {a.title}
                        </span>
                        <span className="shrink-0 text-sm text-[var(--ink-muted)]">
                          {a.minutes} min
                        </span>
                      </span>
                      <span className="text-[15px] text-[var(--ink-soft)]">
                        {a.description}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section alt>
        <H2>Ask us something</H2>
        <p className="mt-4 mb-8 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          This goes to an inbox a person reads. If something is broken, the
          more you tell us the faster it gets fixed, so say what you did and
          what happened instead.
        </p>
        <TicketForm />
      </Section>

      <Section>
        <H2>Other ways to reach us</H2>
        <div className="mt-6 flex flex-col divide-y divide-[var(--rule)] rounded-2xl border border-[var(--rule)] bg-white">
          <div className="px-5 py-4">
            <p className="font-semibold text-[var(--ink)]">Email</p>
            <p className="mt-1 text-[15px] text-[var(--ink-soft)]">
              <a
                href={`mailto:${COMPANY.email}`}
                className="font-semibold text-[var(--brand)] hover:underline"
              >
                {COMPANY.email}
              </a>
              . The form above lands in the same place, so use whichever you
              prefer.
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="font-semibold text-[var(--ink)]">Billing and refunds</p>
            <p className="mt-1 text-[15px] text-[var(--ink-soft)]">
              Payments are handled by Paddle as merchant of record. Our{" "}
              <Link href="/refunds" className="font-semibold text-[var(--brand)] hover:underline">
                refund policy
              </Link>{" "}
              covers what happens and how long it takes. Write to us first
              either way, we would rather sort it out directly.
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="font-semibold text-[var(--ink)]">Cancelling</p>
            <p className="mt-1 text-[15px] text-[var(--ink-soft)]">
              You can cancel yourself in Settings, then Billing. Nobody has to
              talk you out of it and there is no retention call.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
