import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/meta";
import { JsonLd, breadcrumbLd, faqPageLd } from "@/lib/seo/jsonld";
import {
  Breadcrumbs,
  PageHero,
  Section,
  H2,
  CheckList,
  CtaClose,
  RelatedLinks,
} from "../../_components/page-kit";
import { PRICE } from "../../pricing/plans";

export const metadata: Metadata = pageMeta({
  title: "A Sales CRM for Solo Reps and Teams of One",
  description:
    "A CRM for one person. If you run your own book and pay for your own tools, Chumley is $14 a month flat, runs from your phone, and has nothing to administer.",
  path: "/for/solo-sales-reps",
});

const FAQS = [
  {
    q: "Is there a CRM built for just one person?",
    a: `Yes. Chumley is a good fit for a team of one. There are no seats to manage, no admin console, and no team features to click past. It is $${PRICE} a month for you, and that is the whole bill.`,
  },
  {
    q: "How much does a CRM for a solo rep cost?",
    a: `Chumley is $${PRICE} per month, flat, with everything included and a 14-day free trial that does not ask for a card. No setup fee, no annual contract, no upsell to a tier that unlocks the feature you actually need.`,
  },
  {
    q: "Do I need to install anything?",
    a: "No. Chumley runs in your phone browser. Open it once, add it to your home screen, and it behaves like an app. Nothing to download, nothing to update.",
  },
];

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "For", path: "/for/solo-sales-reps" },
  { name: "Solo sales reps", path: "/for/solo-sales-reps" },
];

export default function SoloSalesRepsPage() {
  return (
    <>
      <JsonLd data={breadcrumbLd(CRUMBS)} />
      <JsonLd data={faqPageLd(FAQS)} />

      <Breadcrumbs crumbs={CRUMBS} />
      <PageHero
        eyebrow="For solo reps and teams of one"
        title="A Sales CRM for Solo Reps and Teams of One"
        sub="You run your own book and you pay for your own tools. This one is yours, not your company's. Fourteen dollars a month, everything included, run from the phone in your pocket."
      />

      <Section>
        <H2>It belongs to you, not a sales ops team</H2>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          Most CRMs are built for a company to watch a team. You are not a team.
          You are the rep, the manager, and the person paying the invoice, all
          at once. You do not need dashboards for a sales director who does not
          exist, or permission settings for people who are not there.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          Chumley is a pipeline board and a contact list, and that is close to
          all of it. Your deals live as cards. You drag a card to the next stage
          when the deal moves. On a phone that drag becomes a swipe: flick a card
          right and it advances. Nothing to configure before it works.
        </p>
      </Section>

      <Section alt>
        <H2>What you get for $14 a month</H2>
        <div className="mt-6">
          <CheckList
            items={[
              `One flat price. $${PRICE} a month, everything included. No tier that hides the feature you need behind a bigger plan.`,
              "One tap to call, text, or email a contact, and the interaction logs itself with a timestamp and the outcome. No form to fill in after the call.",
              "Next-step reminders that turn red when they go late, so a warm lead does not quietly cool off while you are busy.",
              "Your contacts kept separate from your live deals, so your pipeline is the handful of things actually in play, not a wall of every name you ever met.",
              "Import your current list from a spreadsheet with field mapping, so your first day is spent selling, not typing.",
              "A dashboard and funnel with real dollar values, so you can see what your month is actually worth.",
            ]}
          />
        </div>
      </Section>

      <Section>
        <H2>Nothing to administer, nothing to learn</H2>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          The reason most solo reps end up back in a spreadsheet is not the
          spreadsheet. It is that the CRM they tried wanted an afternoon of setup
          and a week of habits before it paid anything back. You do not have an
          afternoon. You have calls to make.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          Chumley was built for the person who quit their last CRM by week three.
          You can be tracking real deals in the time it takes to finish a coffee.
          There is no admin panel to keep tidy and no team settings to wade
          through, because there is no team. It is just your pipeline, on your
          phone, everywhere you already work.
        </p>
      </Section>

      <Section alt>
        <H2>Who this is not for</H2>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          If you want marketing automation, custom objects, or a CRM that scores
          leads with a model and routes them across a big team, this is not that,
          and it is not trying to be. Chumley does one job: it keeps your deals
          moving and your follow-ups on time. If you have grown into a team and
          need shared reporting across a dozen reps, look at the small-team page
          instead. For one person who just wants to stop dropping leads, this is
          built for exactly you.
        </p>
      </Section>

      <RelatedLinks
        links={[
          { title: "A CRM for independent and 1099 sales reps", path: "/for/independent-sales-reps" },
          { title: "A simple CRM your small sales team will actually use", path: "/for/small-sales-teams" },
          { title: "A Less Annoying CRM alternative, honestly compared", path: "/compare/less-annoying-crm" },
          { title: "How to keep track of sales leads without losing half of them", path: "/guides/how-to-keep-track-of-sales-leads" },
        ]}
      />

      <CtaClose
        heading="Your pipeline, on your phone, today"
        sub={`$${PRICE} a month, flat, everything included. 14 days free and we do not ask for a card.`}
      />
    </>
  );
}
