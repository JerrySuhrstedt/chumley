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
  title: "A Simple CRM Your Small Sales Team Will Actually Use",
  description:
    "A CRM small businesses actually keep open. Nothing to learn, invite the team by a link, everyone sees the same board, $14 per seat. Whole team tracking in an afternoon.",
  path: "/for/small-sales-teams",
});

const FAQS = [
  {
    q: "What is the simplest CRM for a small sales team?",
    a: `Chumley is built to be the one a non-technical team will actually open. It is a visual board of deals you drag from stage to stage, one tap to call or text, and next-step reminders that turn red when late. There is nothing to configure before it works, and it is $${PRICE} per seat per month with everything included.`,
  },
  {
    q: "How do I get my team on the same CRM?",
    a: "You send them a link. Each person taps it, and they are on your board seeing the same pipeline you do. No IT project, no admin onboarding, no per-user setup. Most teams have everyone tracking deals the same afternoon they start.",
  },
  {
    q: "We have been burned by complicated CRMs. How is this different?",
    a: "The complicated ones fail because nobody keeps them updated, and a CRM nobody updates is worse than a whiteboard. Chumley works the way your team already thinks: a card per deal, moved when the deal moves. There are no required fields to fill in and no training class to sit through, so the board stays current on its own.",
  },
];

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "For", path: "/for/small-sales-teams" },
  { name: "Small sales teams", path: "/for/small-sales-teams" },
];

export default function SmallSalesTeamsPage() {
  return (
    <>
      <JsonLd data={breadcrumbLd(CRUMBS)} />
      <JsonLd data={faqPageLd(FAQS)} />

      <Breadcrumbs crumbs={CRUMBS} />
      <PageHero
        eyebrow="For small sales teams"
        title="A Simple CRM Your Small Sales Team Will Actually Use"
        sub="You have tried a CRM before and watched the team quietly stop opening it. This one has nothing to learn. Invite everyone by a link and have the whole team tracking deals by the end of the afternoon."
      />

      <Section>
        <H2>The problem is not your team, it is the tool</H2>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          You know you need to track your leads. You have probably bought a CRM
          to do it, spent a weekend setting it up, and then watched two of your
          three reps drift back to sticky notes and a group text within a month.
          That is not a discipline problem. It is a design problem.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          A CRM your team does not update is worse than no CRM, because now the
          numbers lie. Chumley is built so the update is the work, not extra work
          on top of it. A rep moves a card when a deal moves forward, taps it to
          call the customer, and the call logs itself. Keeping the board current
          takes no separate effort, so it actually stays current.
        </p>
      </Section>

      <Section alt>
        <H2>Everyone on the same board in an afternoon</H2>
        <div className="mt-6">
          <CheckList
            items={[
              "Invite the team with a link. Each person taps it and they are in, on your board, seeing the same deals. No accounts to provision one at a time.",
              "Everyone sees the same pipeline. Whose deal is stuck, whose is about to close, what the month is worth, all on one board instead of in five separate heads.",
              `One flat price per seat. $${PRICE} per user per month, everything included. Add a rep, add a seat, and you always know the bill before the invoice.`,
              "Nothing to teach. If a person can move a card across a board, they can run Chumley. There is no training class and no manual to hand out.",
              "Import your existing leads from a spreadsheet with field mapping, so the team starts on day one with the customers you already have.",
              "A shared dashboard and funnel in dollars, so you can run a real pipeline review without anyone building a report first.",
            ]}
          />
        </div>
      </Section>

      <Section>
        <H2>Built for the non-technical owner</H2>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          You do not need to be a systems person to run this, and you should not
          have to become one. There is no admin console full of switches, no
          integration to wire up before it does anything useful, and no
          consultant to hire to get started. It runs in any phone browser, so
          there is nothing for anyone to install.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          The whole idea is that your team spends the afternoon selling, not
          learning software. Reminders turn red when a follow-up goes late, so
          the deals that used to slip through the cracks stay in front of the
          person who owns them.
        </p>
      </Section>

      <Section alt>
        <H2>Who this is not for</H2>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          If you are running a large sales floor that needs territory rules,
          approval workflows, forecasting models, and deep integration into a
          stack of other systems, Chumley is going to feel too light. That is on
          purpose. It is aimed at the small team, roughly two to fifteen people,
          that mainly needs everyone to stop dropping leads and to see the same
          pipeline. If that is you, the simplicity is the point.
        </p>
      </Section>

      <RelatedLinks
        links={[
          { title: "A sales CRM for solo and independent reps", path: "/for/solo-sales-reps" },
          { title: "A lead tracker for contractors who hate CRMs", path: "/for/contractors" },
          { title: "A Less Annoying CRM alternative, honestly compared", path: "/compare/less-annoying-crm" },
        ]}
      />

      <CtaClose
        heading="Get the whole team tracking today"
        sub={`$${PRICE} per seat, flat, everything included. 14 days free and we do not ask for a card.`}
      />
    </>
  );
}
