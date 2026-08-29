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
  title: "A Simple CRM for Mobile DJs",
  description:
    "A CRM for DJs that runs in your phone browser. Keep every inquiry, quote, and booking in one place, follow up before they book another DJ, and text a quote back in a tap. $14 flat.",
  path: "/for/djs",
});

const FAQS = [
  {
    q: "Do I need to install anything?",
    a: "No. Chumley runs in the browser on the phone you already carry. Nothing to install, nothing to set up. Pull it up between gigs and knock out your follow-ups.",
  },
  {
    q: "Can it connect to my website inquiry form?",
    a: "Yes. Chumley has an inbound webhook, so the contact form on your DJ site can drop new inquiries straight onto your board as leads, without you copying anything over.",
  },
  {
    q: "How much is it?",
    a: `$${PRICE} a month, flat. That is the whole price. No tiers, no add-ons, and a 14 day free trial with no card. It is priced for the one-person operation paying for it out of gig money.`,
  },
];

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "For", path: "/for/djs" },
  { name: "DJs", path: "/for/djs" },
];

export default function DjsPage() {
  return (
    <>
      <JsonLd data={breadcrumbLd(CRUMBS)} />
      <JsonLd data={faqPageLd(FAQS)} />

      <Breadcrumbs crumbs={CRUMBS} />
      <PageHero
        eyebrow="Chumley for mobile DJs"
        title="A Simple CRM for Mobile DJs"
        sub="Every inquiry, quote, and booking in one place. Follow up before they book another DJ, text a quote back in a tap, and run it all from your phone between gigs."
      />

      <Section>
        <H2>The date goes to the DJ who answers first</H2>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          When someone is looking for a DJ, they are emailing three or four of
          you at once. The bride, the mom, the event planner, they all want a
          number and they want it now. The DJ who texts back a quote the same day
          is the one who books the date. The others get a polite no, or nothing
          at all.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          You are a one-person show. You are loading gear, reading the room,
          running the night. The inquiry that came in Saturday afternoon is easy
          to miss when you are behind the table until midnight. Chumley makes sure
          it does not fall through the cracks.
        </p>
      </Section>

      <Section alt>
        <H2>One board: inquiry, quoted, booked</H2>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          Chumley is a visual board, and every gig is a card. The columns are the
          stages a booking moves through, so you can see at a glance which
          inquiries still need a quote and which quotes are still waiting on a
          yes. On your phone, moving a gig forward is just a swipe.
        </p>
        <div className="mt-6">
          <CheckList
            items={[
              "See which gigs are inquiry, which are quoted, and which are booked, without digging through your inbox or your texts.",
              "Swipe a card to move a gig forward. When they sign, flick it to booked and it is off your follow-up list.",
              "Next-step reminders that turn red when they go late, so the quote you meant to send Monday does not get lost until the date is already gone.",
            ]}
          />
        </div>
      </Section>

      <Section>
        <H2>Follow up from your phone between gigs</H2>
        <div className="mt-6">
          <CheckList
            items={[
              "Tap once to text back a quote, and the message logs itself against that gig so you know exactly what you quoted and when.",
              "Tap to call or email the same way, all from the card, all recorded without you filling in a form after.",
              "Message templates for the reply you send over and over. Your thanks for reaching out, here is my pricing message goes out in a tap.",
              "Runs in your phone browser, so you can clear your follow-ups from the car before you even pull out of the parking lot.",
            ]}
          />
        </div>
      </Section>

      <Section alt>
        <H2>Priced for a DJ, not a sales floor</H2>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          ${PRICE} a month, flat. Not per seat you do not have, not a plan that
          gets more expensive the more it does. You are the one paying for it, out
          of gig money, so the price is one number you can keep track of.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          Bring your past inquiries in with a CSV import, and connect the contact
          form on your DJ site with the inbound webhook so new inquiries land on
          the board on their own. Nothing to install, nothing to learn.
        </p>
      </Section>

      <RelatedLinks
        links={[
          { title: "A lead tracker wedding vendors actually keep using", path: "/for/wedding-vendors" },
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
        heading="Book more of the gigs you already get asked about"
        sub={`$${PRICE} a month, flat, everything included. 14 days free and we do not ask for a card.`}
      />
    </>
  );
}
