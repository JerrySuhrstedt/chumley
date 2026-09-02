import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/meta";
import { JsonLd, breadcrumbLd, faqPageLd } from "@/lib/seo/jsonld";
import {
  Breadcrumbs,
  PageHero,
  Section,
  H2,
  CheckList,
  CompareTable,
  CtaClose,
  RelatedLinks,
} from "../../_components/page-kit";
import { PRICE } from "../../pricing/plans";

/**
 * The 1099 rep, as a contractual status rather than a headcount.
 *
 * This page and /for/solo-sales-reps are deliberately kept apart. Solo is
 * about being one person with nobody to administer. This one is about being
 * independent: carrying lines you do not own, for principals who are not your
 * employer, with a book of business that is your own asset. Somebody can be
 * independent inside a two person agency, and plenty of solo reps are W-2.
 * Different worry, different search, different page.
 */

export const metadata: Metadata = pageMeta({
  title: "A CRM for Independent Sales Reps",
  description:
    "Built for 1099 reps who carry their own book. Your contacts stay yours, multiple lines live on one board, and it is $14 a month out of your own pocket, not $65 a seat.",
  path: "/for/independent-sales-reps",
});

const FAQS = [
  {
    q: "What is the best CRM for independent sales reps?",
    a: `The one you still open in month three. For a 1099 rep that usually means cheap, fast on a phone, and yours rather than a principal's. Chumley is $${PRICE} a month flat, works from your phone browser, and exports everything you have put in it whenever you ask.`,
  },
  {
    q: "Can I take my contacts with me if I drop a line?",
    a: "Yes, and you should be able to. Your account is yours, not a principal's, so nobody can switch it off or lock you out of it. Export the whole thing to a spreadsheet any time, including your notes and activity history, not just names and numbers.",
  },
  {
    q: "Can I track several companies' products in one CRM?",
    a: "Yes. Each lead carries the company it belongs to, so you can work one board and still see which line a deal came from. There is nothing to set up for it and no per-line cost.",
  },
  {
    q: "How much should an independent rep pay for a CRM?",
    a: `Less than most of them charge. Seat pricing was designed for companies buying in bulk, which is why $65 to $165 a month is normal and why it feels absurd when the seat is yours alone. Chumley is $${PRICE} a month, everything included, with a 14-day trial that does not ask for a card.`,
  },
];

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "For", path: "/for/independent-sales-reps" },
  { name: "Independent sales reps", path: "/for/independent-sales-reps" },
];

export default function IndependentSalesRepsPage() {
  return (
    <>
      <JsonLd data={breadcrumbLd(CRUMBS)} />
      <JsonLd data={faqPageLd(FAQS)} />

      <Breadcrumbs crumbs={CRUMBS} />
      <PageHero
        eyebrow="For independent and 1099 reps"
        title="A CRM for Independent Sales Reps"
        sub="You carry the lines, you own the relationships, and you buy your own tools. This one costs $14 a month, runs from your phone, and everything in it stays yours."
      />

      <Section>
        <H2>Your book should leave when you do</H2>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          The relationships are the asset. You built them over years, across
          more than one line, and they are what you would be selling if you ever
          sold anything. So it matters a great deal whose system they sit in.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          Reps who work a principal's CRM find this out at the worst possible
          moment. The agreement ends, the login stops working the same week, and
          a decade of notes about who buys what and when is now somebody else's
          property. Your Chumley account is in your name. Nobody can switch it
          off, and you can export the whole thing, notes and history included,
          any day you like.
        </p>
      </Section>

      <Section alt>
        <H2>More than one line, one board</H2>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          Carrying three lines does not mean living in three systems. Every lead
          records the company it belongs to, so you can work a single pipeline in
          the morning and still answer the only question a principal ever asks,
          which is what is happening with their deals specifically.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          There is no configuration behind this and no extra charge for a second
          line. It is a field on a card. That is the whole feature, and it is
          deliberately the whole feature.
        </p>
      </Section>

      <Section>
        <H2>Nobody is reimbursing your software</H2>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          Seat pricing is built for a company buying twenty at once and expensing
          it. When the seat is yours and the expense is yours, the same number
          reads very differently, which is why so many independent reps end up
          back in a spreadsheet with the CRM tab closed.
        </p>
        <div className="mt-6">
          <CompareTable
            columns={["Chumley", "A principal's CRM", "A spreadsheet"]}
            rows={[
              {
                label: "Who owns the data",
                values: ["You", "They do", "You"],
              },
              {
                label: "Export everything, any time",
                values: [true, false, true],
              },
              {
                label: "Costs you",
                values: [`$${PRICE}/mo`, "Nothing, until it ends", "Nothing"],
              },
              {
                label: "Usable on a phone",
                values: [true, "Sometimes", false],
              },
              {
                label: "Chases your follow-ups",
                values: [true, true, false],
              },
              {
                label: "Several lines in one place",
                values: [true, false, true],
              },
            ]}
          />
        </div>
      </Section>

      <Section alt>
        <H2>On commission, a dropped follow-up is money</H2>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          Salaried reps lose a deal and lose a deal. You lose a deal and lose the
          rent on it. That is the entire argument for tracking follow-ups
          somewhere other than your memory, and it is why the reminder is the
          part of this that earns its keep.
        </p>
        <div className="mt-6">
          <CheckList
            items={[
              "Every lead carries one next step with a date on it, and the card turns red when that date passes. Nothing goes quiet for three weeks without you noticing.",
              "One tap to call, text, or email from the card, and the interaction logs itself with the time and outcome. No writing it up afterwards.",
              "Each lead keeps the company or line it belongs to, so a principal's question takes a filter rather than an evening.",
              "Import the list you already have from a spreadsheet, with field mapping, so your first day is spent selling.",
              `One flat price. $${PRICE} a month, everything included, no tier that hides the useful part.`,
              "Export everything you have ever put in, whenever you want it, because it is yours.",
            ]}
          />
        </div>
      </Section>

      <Section>
        <H2>Who this is not for</H2>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          If a principal requires you to work their system and log activity where
          they can audit it, keep doing that. Some agreements say so in writing
          and this is not worth a conversation with them over.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          It is also not a commission calculator, a quoting tool, or a
          territory-management system, and it will not reconcile what you are
          owed against what you were paid. It keeps your deals moving and your
          follow-ups on time. If that is the part you are currently doing from
          memory, this is built for you.
        </p>
      </Section>

      <RelatedLinks
        links={[
          { title: "A sales CRM for solo reps and teams of one", path: "/for/solo-sales-reps" },
          { title: "A Less Annoying CRM alternative, honestly compared", path: "/compare/less-annoying-crm" },
          { title: "A free sales pipeline tracker spreadsheet", path: "/tools/sales-pipeline-tracker" },
        ]}
      />

      <CtaClose
        heading="Your book, in your name, on your phone"
        sub={`$${PRICE} a month, flat, everything included. 14 days free and we do not ask for a card.`}
      />
    </>
  );
}
