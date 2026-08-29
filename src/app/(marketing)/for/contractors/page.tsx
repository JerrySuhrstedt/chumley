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
  title: "A Lead Tracker for Contractors Who Hate CRMs",
  description:
    "Track bids and follow-ups from the truck. One tap to call the homeowner back, nothing to set up, works on the phone you already carry. $14 a month, 14-day free trial.",
  path: "/for/contractors",
});

const FAQS = [
  {
    q: "What is a simple CRM for contractors?",
    a: `Chumley is a lead and follow-up tracker for contractors and trades. Every bid is a card on a board you move as the job progresses, with one tap to call the homeowner back. It is $${PRICE} a month, runs in your phone browser, and there is nothing to set up before it works.`,
  },
  {
    q: "Can I use it from the truck?",
    a: "Yes, that is the whole idea. It runs in your phone browser, so add it to your home screen and it opens like an app. Log a bid at the kitchen table, set a follow-up before you pull out of the driveway, and tap a card to call the next homeowner from the next job.",
  },
  {
    q: "Does it schedule crews or send invoices?",
    a: "No, and it does not pretend to. Chumley tracks leads and follow-ups, the part between the phone ringing and the job being sold. It does not dispatch crews, build schedules, or send invoices. If you want it to run the whole business, it will disappoint you. If you want to stop losing bids, it is built for that.",
  },
];

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "For", path: "/for/contractors" },
  { name: "Contractors", path: "/for/contractors" },
];

export default function ContractorsPage() {
  return (
    <>
      <JsonLd data={breadcrumbLd(CRUMBS)} />
      <JsonLd data={faqPageLd(FAQS)} />

      <Breadcrumbs crumbs={CRUMBS} />
      <PageHero
        eyebrow="For contractors and trades"
        title="A Lead Tracker for Contractors Who Hate CRMs"
        sub="You are good at the work, not at software. Track your bids and follow-ups from the truck, call the homeowner back in one tap, and stop losing jobs to the guy who called first. Nothing to set up."
      />

      <Section>
        <H2>The job you lose is the one you forgot to call back</H2>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          You quote a remodel on Monday, the homeowner says they want to think
          about it, and by Thursday the bid is buried under six new ones. You did
          not lose that job on price. You lost it because you never called back,
          and someone else did. That is the most expensive habit in the trades,
          and it is the one thing a simple tracker fixes.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          Chumley keeps every bid as a card on a board: new lead, quoted,
          follow-up, won. You move a card as the job moves. On a phone it is a
          swipe. You can see at a glance which homeowners are waiting to hear back
          from you, because their follow-up reminder has turned red.
        </p>
      </Section>

      <Section alt>
        <H2>Run it from the truck</H2>
        <div className="mt-6">
          <CheckList
            items={[
              "One tap to call the homeowner back, right off the card, and the call logs itself with the time and how it went. No writing it down after.",
              "Next-step reminders that turn red when they go late, so a bid never sits for a week while you are on a roof.",
              "Works on the phone you already carry. It runs in the browser, so add it to your home screen and skip the app store entirely.",
              "Nothing to set up. No fields to design, no pipeline to build first. Add your first lead in the driveway and you are already using it.",
              `One flat price. $${PRICE} a month, everything included, and a 14-day free trial that does not ask for a card.`,
              "Import the leads and past customers you already have in a spreadsheet, so you are not starting from an empty screen.",
            ]}
          />
        </div>
      </Section>

      <Section>
        <H2>Built for people who quit their last CRM</H2>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          Most contractors who tried a CRM gave up on it in the first few weeks,
          and they were right to. Those tools are built for office people with
          time to fill in forms. You are standing in a garage giving a number to a
          homeowner. The tool has to keep up with that, or it gets ignored.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          Chumley is deliberately small. It does the part that actually costs you
          money when you skip it: remembering who to call and calling them. If a
          person can text, they can run this.
        </p>
      </Section>

      <Section alt>
        <H2>What it is not</H2>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          Be clear on this before you sign up. Chumley is not field service
          software. It does not schedule crews, dispatch trucks, build estimates,
          or send invoices. It will not run your calendar or your books. It is a
          lead and follow-up tracker, full stop. If you need to manage the whole
          operation, look at a field service platform. If you keep losing bids
          because nobody called the homeowner back, that is the exact hole this
          fills, and nothing more.
        </p>
      </Section>

      <RelatedLinks
        links={[
          { title: "A sales CRM for solo and independent reps", path: "/for/solo-sales-reps" },
          { title: "A simple CRM your small sales team will actually use", path: "/for/small-sales-teams" },
          { title: "How to keep track of sales leads without losing half of them", path: "/guides/how-to-keep-track-of-sales-leads" },
        ]}
      />

      <CtaClose
        heading="Stop losing bids you already quoted"
        sub={`$${PRICE} a month, flat, everything included. 14 days free and we do not ask for a card.`}
      />
    </>
  );
}
