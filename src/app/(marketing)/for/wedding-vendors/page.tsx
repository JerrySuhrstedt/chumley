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
} from "@/app/(marketing)/_components/page-kit";
import { PRICE } from "@/app/(marketing)/pricing/plans";

export const metadata: Metadata = pageMeta({
  title: "A Lead Tracker Wedding Vendors Actually Keep Using",
  description:
    "A CRM for wedding vendors that runs in your phone browser. Log an inquiry in ten seconds, text the couple back, and keep every lead's stage in view before they book someone else.",
  path: "/for/wedding-vendors",
});

const FAQS = [
  {
    q: "Do I need to install anything?",
    a: "No. Chumley runs in whatever browser is already on your phone. There is nothing to download and nothing to set up. Open it at a venue, log the inquiry, and get back to the couple in front of you.",
  },
  {
    q: "Can it connect to my website inquiry form?",
    a: "Yes. Chumley has an inbound webhook, so you can wire your website contact form to it. When a couple fills out your form, the inquiry lands in Chumley as a new lead on its own, before you have even seen the email.",
  },
  {
    q: "How much is it?",
    a: `$${PRICE} per person per month, flat. Everything is included, there are no tiers, and you start with a 14 day free trial with no card.`,
  },
];

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "For", path: "/for/wedding-vendors" },
  { name: "Wedding vendors", path: "/for/wedding-vendors" },
];

export default function WeddingVendorsPage() {
  return (
    <>
      <JsonLd data={breadcrumbLd(CRUMBS)} />
      <JsonLd data={faqPageLd(FAQS)} />

      <Breadcrumbs crumbs={CRUMBS} />
      <PageHero
        eyebrow="Chumley for wedding vendors"
        title="A Lead Tracker Wedding Vendors Actually Keep Using"
        sub="Inquiries come in fast and couples book fast. Log a lead in ten seconds, text them back, and see every couple's stage from your phone at the venue."
      />

      <Section>
        <H2>The couple who booked someone else was following up with both of you</H2>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          A wedding lead has a short window. A couple sends the same message to
          four photographers, three florists, or two venues on the same night,
          and the one who answers first with a real quote is usually the one who
          gets the date. The other three never hear back, and they never find
          out why.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          Losing that date is rarely about your work or your price. It is about
          the inquiry that sat in your inbox for two days while you were shooting
          a wedding, running a tasting, or setting up a room. Chumley is built so
          the follow-up happens no matter how full your weekend is.
        </p>
      </Section>

      <Section alt>
        <H2>Log it in ten seconds, from wherever you are standing</H2>
        <div className="mt-6">
          <CheckList
            items={[
              "An inquiry comes in and you add the couple as a lead in about ten seconds, right from your phone. No laptop, no login you have to remember, no waiting until you are home.",
              "Set a next-step reminder the moment you log the lead. It turns red when it goes late, so the couple you meant to quote on Tuesday does not quietly slip to next week.",
              "Tap once to text the couple back. The message logs itself against their card, so you always know what you said and when you said it.",
              "Contacts stay separate from live deals, so past couples and referral partners do not clutter the leads you are actively chasing this month.",
            ]}
          />
        </div>
      </Section>

      <Section>
        <H2>See every couple&rsquo;s stage at a glance</H2>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          Chumley is a visual board. Every couple is a card, and the columns are
          the stages a booking moves through: inquiry, quoted, booked. On your
          phone, moving a card forward is a swipe. When a couple signs, you flick
          their card to booked and you are done.
        </p>
        <div className="mt-6">
          <CheckList
            items={[
              "Inquiry, quoted, booked, all visible on one board, so you never wonder which couples are still waiting on a price from you.",
              "Message templates for the reply you send twenty times a month. The thanks for reaching out, here is my pricing message goes out in a tap instead of being retyped every time.",
              "Everything runs in the phone browser, so you can catch up on follow-ups in the truck between a ceremony and a reception.",
            ]}
          />
        </div>
      </Section>

      <Section alt>
        <H2>Let your website hand you the lead</H2>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          Most wedding vendors have a contact form on their site, and most of
          those inquiries turn into an email that gets buried. Chumley has an
          inbound webhook you can connect to that form. When a couple submits it,
          the inquiry shows up in Chumley as a new lead on its own, already on the
          board, ready for you to set a follow-up.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          You can also bring your past inquiries in with a CSV import, so the
          couples you already talked to are not left behind when you start.
        </p>
      </Section>

      <RelatedLinks
        links={[
          { title: "A simple CRM for mobile DJs", path: "/for/djs" },
          {
            title: "Chumley for solo and independent sales reps",
            path: "/for/solo-sales-reps",
          },
          {
            title: "The sales follow-up app that fits in your pocket",
            path: "/guides/sales-follow-up-app",
          },
        ]}
      />

      <CtaClose
        heading="Stop losing dates to a slow reply"
        sub={`$${PRICE} per person, flat, everything included. 14 days free and we do not ask for a card.`}
      />
    </>
  );
}
