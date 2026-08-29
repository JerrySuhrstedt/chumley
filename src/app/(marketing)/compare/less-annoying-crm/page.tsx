import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/meta";
import {
  JsonLd,
  breadcrumbLd,
  faqPageLd,
} from "@/lib/seo/jsonld";
import {
  Breadcrumbs,
  PageHero,
  Section,
  H2,
  CompareTable,
  CheckList,
  CtaClose,
  RelatedLinks,
} from "../../_components/page-kit";
import { PRICE } from "../../pricing/plans";

export const metadata: Metadata = pageMeta({
  title: "Less Annoying CRM Alternative",
  description:
    "An honest comparison of Chumley and Less Annoying CRM for solo reps and small sales teams. Where each one fits, and the three things Chumley does differently.",
  path: "/compare/less-annoying-crm",
});

const FAQS = [
  {
    q: "Is Chumley cheaper than Less Annoying CRM?",
    a: `Slightly. Chumley is $${PRICE} per user per month, flat. Less Annoying CRM is $15 per user per month. Both are a single price with everything included, so the real difference is not the dollar, it is how the two work.`,
  },
  {
    q: "What is the main difference between Chumley and Less Annoying CRM?",
    a: "Less Annoying CRM is built around a contact list and task reminders. Chumley is built around a visual pipeline board you move deals across, with one tap to call, text, or email. If you think in a list of follow-ups, Less Annoying CRM fits. If you think in stages a deal moves through, Chumley fits.",
  },
  {
    q: "Is Less Annoying CRM a good CRM?",
    a: "Yes. It is genuinely simple, fairly priced, and known for good support. This page is not here to say otherwise. It is here to help you tell which of two good, simple tools matches how you actually work.",
  },
];

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Compare", path: "/compare/less-annoying-crm" },
  { name: "Less Annoying CRM", path: "/compare/less-annoying-crm" },
];

export default function LacrmComparePage() {
  return (
    <>
      <JsonLd data={breadcrumbLd(CRUMBS)} />
      <JsonLd data={faqPageLd(FAQS)} />

      <Breadcrumbs crumbs={CRUMBS} />
      <PageHero
        eyebrow="Chumley vs Less Annoying CRM"
        title="A Less Annoying CRM alternative, honestly compared"
        sub="Both are simple, single-price CRMs for small teams. They just think about your day differently. Here is which one fits how you actually sell."
      />

      <Section>
        <H2>The short version</H2>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          Less Annoying CRM is a good product and has been for years. It is
          simple, it costs $15 per user, and its support is a real strength. If
          you already use it and your reps open it every day, there is no reason
          to switch.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          The difference is the shape of the tool. Less Annoying CRM organizes
          your work as a contact list with follow-up tasks. Chumley organizes it
          as a board of deals you drag from one stage to the next, built to be
          run from a phone with one tap to call, text, or email. Same goal, two
          different mental models. Pick the one that matches how the picture of
          your pipeline already looks in your head.
        </p>
      </Section>

      <Section alt>
        <H2>Side by side</H2>
        <div className="mt-6">
          <CompareTable
            columns={["Chumley", "Less Annoying CRM"]}
            rows={[
              { label: "Price per user / month", values: [`$${PRICE}`, "$15"] },
              { label: "Everything included, no tiers", values: [true, true] },
              { label: "Free trial", values: ["14 days, no card", "30 days"] },
              { label: "Visual drag-and-drop pipeline board", values: [true, false] },
              { label: "Swipe a deal forward on a phone", values: [true, false] },
              { label: "One-tap call, text, and email logging", values: [true, false] },
              { label: "Contact list with follow-up tasks", values: [true, true] },
              { label: "Nothing to install, runs in the browser", values: [true, true] },
              { label: "Built mobile-first", values: [true, "Mobile web, desktop-first"] },
              { label: "Calendar and task reminders", values: ["Next-step reminders", true] },
            ]}
          />
        </div>
        <p className="mt-4 text-sm text-[var(--ink-muted)]">
          Pricing and features as published by both products in 2026. If
          anything here is out of date, tell us and we will fix it.
        </p>
      </Section>

      <Section>
        <H2>The three things Chumley does that Less Annoying CRM does not</H2>
        <div className="mt-6">
          <CheckList
            items={[
              "A visual board. Your deals are cards in columns, and you move a card when the deal moves. Less Annoying CRM shows you a list and a calendar, not a pipeline you drag across.",
              "One-tap logging from the field. Tap a card to call, text, or email, and the interaction records itself with a timestamp. No form to fill in after the call.",
              "A phone-first design. On a phone the board becomes a swipe: flick a deal right to move it forward. Chumley was built for the rep working standing up, not adapted to the phone after the fact.",
            ]}
          />
        </div>
      </Section>

      <Section alt>
        <H2>When Less Annoying CRM is the better pick</H2>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          If your work is really a long list of people to follow up with on
          certain dates, rather than deals moving through stages, its task-and-
          calendar model may suit you better. Its 30-day trial is longer, and
          its support has a long reputation. We would rather you use the tool
          that fits than churn out of ours in a month.
        </p>
      </Section>

      <RelatedLinks
        links={[
          { title: "Chumley for solo and independent sales reps", path: "/for/solo-sales-reps" },
          { title: "A simpler Pipedrive alternative for small teams", path: "/compare/pipedrive" },
          { title: "How to keep track of sales leads without losing half of them", path: "/guides/how-to-keep-track-of-sales-leads" },
        ]}
      />

      <CtaClose
        heading="Try the board for yourself"
        sub={`$${PRICE} per user, flat, everything included. 14 days free and we do not ask for a card.`}
      />
    </>
  );
}
