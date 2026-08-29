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
  title: "OnePageCRM Alternative",
  description:
    "OnePageCRM organizes sales as a next-action to-do list. Chumley organizes it as a visual board you drag deals across with one-tap logging. Here is which model fits how you sell.",
  path: "/compare/onepagecrm",
});

const FAQS = [
  {
    q: "Is Chumley cheaper than OnePageCRM?",
    a: `No. OnePageCRM is cheaper, about $9.95 per user per month, and it is a good tool. Chumley is $${PRICE} per user per month, flat, everything included. The choice here is not about the few dollars. It is about whether you work from a next-action list or from a visual board.`,
  },
  {
    q: "What is the main difference between Chumley and OnePageCRM?",
    a: "The shape of the day. OnePageCRM gives every contact a single next action, so your work reads like a to-do list you clear from the top. Chumley gives you a board of deals you drag from one stage to the next, run from your phone with one tap to call, text, or email. Same goal, two mental models.",
  },
  {
    q: "Is OnePageCRM a good CRM?",
    a: "Yes. OnePageCRM is genuinely simple, action-focused, and cheaper than Chumley. If you already think in a list of next actions, it fits well and this page is not here to talk you out of it.",
  },
];

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Compare", path: "/compare/onepagecrm" },
  { name: "OnePageCRM", path: "/compare/onepagecrm" },
];

export default function OnePageCrmComparePage() {
  return (
    <>
      <JsonLd data={breadcrumbLd(CRUMBS)} />
      <JsonLd data={faqPageLd(FAQS)} />

      <Breadcrumbs crumbs={CRUMBS} />
      <PageHero
        eyebrow="Chumley vs OnePageCRM"
        title="A OnePageCRM alternative, honestly compared"
        sub="OnePageCRM turns your pipeline into a next-action to-do list. Chumley turns it into a board you drag deals across from your phone. Pick the model that matches how you think."
      />

      <Section>
        <H2>The short version</H2>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          OnePageCRM is a good product, and it is cheaper than Chumley, around
          $9.95 per user per month. Its whole idea is the next action: every
          contact gets one thing to do next, and your day becomes a to-do list
          you clear from the top. If that is how your brain already works, it is
          a clean fit and we would not try to move you.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          Chumley organizes the same work differently. Instead of a list of next
          actions, you get a visual board of deals you drag from one stage to
          the next, built to run from a phone with one tap to call, text, or
          email that logs itself. If you picture your pipeline as stages a deal
          moves through, the board matches that. If you picture a running list
          of follow-ups, OnePageCRM matches that.
        </p>
      </Section>

      <Section alt>
        <H2>Side by side</H2>
        <div className="mt-6">
          <CompareTable
            columns={["Chumley", "OnePageCRM"]}
            rows={[
              {
                label: "Price per user / month",
                values: [`$${PRICE}`, "~$9.95"],
              },
              { label: "Everything included, no tiers", values: [true, true] },
              { label: "Free trial", values: ["14 days, no card", "21 days"] },
              {
                label: "Visual drag-and-drop pipeline board",
                values: [true, false],
              },
              {
                label: "Next-action to-do list for every contact",
                values: ["Next-step reminders", true],
              },
              {
                label: "Swipe a deal forward on a phone",
                values: [true, false],
              },
              {
                label: "One-tap call, text, and email logging",
                values: [true, "Actions and logging"],
              },
              { label: "Built mobile-first", values: [true, "Mobile app, desktop-first"] },
              {
                label: "Nothing to install, runs in the browser",
                values: [true, "Web app plus mobile apps"],
              },
              {
                label: "Cheaper monthly price",
                values: [false, true],
              },
            ]}
          />
        </div>
        <p className="mt-4 text-sm text-[var(--ink-muted)]">
          Pricing and features as published by both products in 2026. If
          anything here is out of date, tell us and we will fix it.
        </p>
      </Section>

      <Section>
        <H2>What Chumley does differently</H2>
        <div className="mt-6">
          <CheckList
            items={[
              "A visual board instead of a list. Your deals are cards in columns and you move a card when the deal moves. OnePageCRM shows you the next action for each contact, not a pipeline you drag across.",
              "A phone-first swipe. On a phone the board becomes a swipe: flick a deal right to move it forward a stage. The board was built for the rep working standing up.",
              "One-tap logging with the outcome. Tap a card to call, text, or email, and it records itself with a timestamp and how it went, connected, voicemail, no answer, or bad number.",
              "Deals kept separate from contacts. Your live deals live on the board while your contacts stay their own list, so the pipeline stays about what is actually moving.",
            ]}
          />
        </div>
      </Section>

      <Section alt>
        <H2>When OnePageCRM is the better pick</H2>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          If your selling is really a long list of people to reach out to next,
          rather than deals moving through stages, the next-action model may suit
          you better, and it costs a few dollars less per user. That is a fair
          reason to choose it. We would rather you use the tool that fits how you
          think than switch to a board you have to force your work into.
        </p>
      </Section>

      <RelatedLinks
        links={[
          { title: "Chumley for solo and independent sales reps", path: "/for/solo-sales-reps" },
          { title: "An honest Less Annoying CRM comparison", path: "/compare/less-annoying-crm" },
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
