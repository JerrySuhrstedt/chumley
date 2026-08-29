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
  title: "Pipedrive Alternative for Small Teams",
  description:
    "A simpler, flatter-priced, mobile-first Pipedrive alternative for solo reps and small sales teams. One price, everything included, and a board you run from your phone.",
  path: "/compare/pipedrive",
});

const FAQS = [
  {
    q: "Is Chumley cheaper than Pipedrive?",
    a: `It can be, and it is simpler to reason about. Chumley is one price, $${PRICE} per user per month, everything included. Pipedrive runs in tiers, roughly $14 to $49 or more per user per month depending on which plan you need. If the features you want sit on a higher Pipedrive tier, Chumley is cheaper and you skip the tier math.`,
  },
  {
    q: "What is the main difference between Chumley and Pipedrive?",
    a: "Depth. Pipedrive is a deep, feature-heavy sales CRM with custom deal fields, automations, reporting, email sync, and add-ons. Chumley does less on purpose. It is a visual board you run from your phone with one tap to call, text, or email, at one flat price. Pipedrive is more when you need more. Chumley is for the person who found Pipedrive was more than they used.",
  },
  {
    q: "Is Pipedrive a good CRM?",
    a: "Yes. Pipedrive is a well-built, capable sales CRM and a lot of teams get real value from it. This page is not here to argue otherwise. It is here for the person who bought Pipedrive, used a fraction of it, and wants something smaller they will actually open every day.",
  },
];

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Compare", path: "/compare/pipedrive" },
  { name: "Pipedrive", path: "/compare/pipedrive" },
];

export default function PipedriveComparePage() {
  return (
    <>
      <JsonLd data={breadcrumbLd(CRUMBS)} />
      <JsonLd data={faqPageLd(FAQS)} />

      <Breadcrumbs crumbs={CRUMBS} />
      <PageHero
        eyebrow="Chumley vs Pipedrive"
        title="A simpler, flatter-priced Pipedrive alternative"
        sub="Pipedrive is powerful and can do a lot. Chumley does less on purpose, at one flat price, built to run from your phone. Here is which one fits."
      />

      <Section>
        <H2>The short version</H2>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          Pipedrive is a good sales CRM. It is built around a visual pipeline,
          it is capable, and it can do a lot: custom deal fields, automations,
          reporting, email sync, add-ons, and pricing tiers to match. If your
          team uses that depth, stay with it. We are not going to pretend
          Chumley has more features, because it does not.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          Chumley is the other direction. Nothing to set up, nothing to learn,
          one price with everything included, and a board you run from your
          phone with one tap to call, text, or email. It is for the person who
          bought Pipedrive, used maybe a quarter of it, and stopped opening it.
          If that is you, less tool may get more done.
        </p>
      </Section>

      <Section alt>
        <H2>Side by side</H2>
        <div className="mt-6">
          <CompareTable
            columns={["Chumley", "Pipedrive"]}
            rows={[
              {
                label: "Price per user / month",
                values: [`$${PRICE}`, "~$14 to $49+, by tier"],
              },
              {
                label: "Everything included, no tiers",
                values: [true, false],
              },
              { label: "Free trial", values: ["14 days, no card", "14 days"] },
              {
                label: "Visual drag-and-drop pipeline board",
                values: [true, true],
              },
              {
                label: "Swipe a deal forward on a phone",
                values: [true, false],
              },
              {
                label: "One-tap call, text, and email logging",
                values: [true, "Via calls and integrations"],
              },
              { label: "Built mobile-first", values: [true, "Mobile app, desktop-first"] },
              {
                label: "Nothing to install, runs in the browser",
                values: [true, "Web app plus mobile apps"],
              },
              {
                label: "Custom deal fields and pipelines",
                values: ["Kept simple", true],
              },
              {
                label: "Automations, reporting, and add-ons",
                values: ["Not the point", true],
              },
              {
                label: "Email sync and inbox",
                values: [false, true],
              },
            ]}
          />
        </div>
        <p className="mt-4 text-sm text-[var(--ink-muted)]">
          Pricing and features as published by both products in 2026. Pipedrive
          tiers and prices change, so check theirs before you decide. If
          anything here is out of date, tell us and we will fix it.
        </p>
      </Section>

      <Section>
        <H2>What Chumley does differently</H2>
        <div className="mt-6">
          <CheckList
            items={[
              "One flat price. $" +
                PRICE +
                " per user per month, everything included. No tier to climb when you need one more feature, and no guessing which plan you are supposed to be on.",
              "A phone-first board. On a phone the board becomes a swipe: flick a deal right to move it forward. Chumley was built for the rep working standing up, not a desktop tool with a phone app bolted on.",
              "One-tap logging from the field. Tap a card to call, text, or email, and it records itself with a timestamp and the outcome, connected, voicemail, no answer, or bad number. No form to fill in after.",
              "Less to set up and less to learn. There is no field mapping, automation builder, or admin console to configure first. You import your list and start moving deals the same day.",
            ]}
          />
        </div>
      </Section>

      <Section alt>
        <H2>When Pipedrive is the better pick</H2>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          If you need custom deal fields, automation rules, deep reporting, a
          synced email inbox, or the add-ons Pipedrive sells, buy Pipedrive.
          Those are real strengths and Chumley does not try to match them. A
          larger team with a defined sales process and someone to administer the
          tool will get more out of Pipedrive than out of us.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          Chumley is the right call when the honest answer is that you used a
          fraction of Pipedrive and wanted something smaller. We would rather you
          pick the tool that fits than switch to ours and churn in a month.
        </p>
      </Section>

      <RelatedLinks
        links={[
          { title: "Chumley for solo and independent sales reps", path: "/for/solo-sales-reps" },
          { title: "Chumley for small sales teams", path: "/for/small-sales-teams" },
          { title: "An honest Less Annoying CRM comparison", path: "/compare/less-annoying-crm" },
        ]}
      />

      <CtaClose
        heading="Try the simpler board"
        sub={`$${PRICE} per user, flat, everything included. 14 days free and we do not ask for a card.`}
      />
    </>
  );
}
