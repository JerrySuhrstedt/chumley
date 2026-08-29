import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo/meta";
import { JsonLd, breadcrumbLd, articleLd, faqPageLd } from "@/lib/seo/jsonld";
import {
  Breadcrumbs,
  PageHero,
  Prose,
  RelatedLinks,
  CtaClose,
} from "@/app/(marketing)/_components/page-kit";
import { PRICE } from "@/app/(marketing)/pricing/plans";

const PATH = "/guides/how-to-keep-track-of-sales-leads";
const TITLE = "How to Keep Track of Sales Leads Without Losing Half of Them";
const DESC =
  "Leads slip through sticky notes, memory, and a spreadsheet nobody updates. Here is what a simple lead-tracking system needs and how to set one up today.";

export const metadata: Metadata = pageMeta({
  title: TITLE,
  description: DESC,
  path: PATH,
});

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Guides", path: "/guides" },
  { name: "Keep track of sales leads", path: PATH },
];

const FAQS = [
  {
    q: "What is the simplest way to keep track of sales leads?",
    a: "One place that holds every lead, a stage that says where each one sits, and a next step with a date on it. That is the whole system. It can be a spreadsheet at first, but the moment you are working leads from your phone or forgetting to follow up, a simple pipeline tool does it better.",
  },
  {
    q: "Why do sales leads get lost?",
    a: "Almost always because the lead lived in one person's memory or on a sticky note, and there was no reminder tied to a date. Nothing failed dramatically. The follow-up just never got scheduled, so it never happened.",
  },
  {
    q: "How often should I follow up with a lead?",
    a: "Until they buy or they tell you to stop. Most sales take several touches. The point of a system is that the next touch is always scheduled, so a slow lead does not quietly fall off the list.",
  },
];

export default function KeepTrackOfLeadsGuide() {
  return (
    <>
      <JsonLd data={breadcrumbLd(CRUMBS)} />
      <JsonLd data={articleLd({ headline: TITLE, description: DESC, path: PATH })} />
      <JsonLd data={faqPageLd(FAQS)} />

      <Breadcrumbs crumbs={CRUMBS} />
      <PageHero
        eyebrow="Guides"
        title={TITLE}
        sub="Most lost deals were never lost on purpose. Nobody wrote the next step down. Here is a system simple enough that you will actually keep it."
        cta={false}
      />

      <Prose>
        <p>
          Here is the uncomfortable part. Most leads that go cold do not go cold
          because the customer picked someone else. They go cold because nobody
          followed up. The lead came in, it went into a head or a sticky note,
          and the next call never got scheduled. Two weeks later you cannot even
          remember the name.
        </p>
        <p>
          If that stings a little, good. It means you can fix it, because the
          problem is not your selling. It is your system, or the lack of one.
        </p>

        <h2>The four ways leads actually slip</h2>
        <p>Watch for these. They are the usual suspects.</p>
        <ul>
          <li>
            <strong>Memory.</strong> You tell yourself you will remember to call
            back Thursday. You have twenty other leads and a job to run. You will
            not remember.
          </li>
          <li>
            <strong>Sticky notes and the back of an envelope.</strong> Fine for
            one lead. A pile of them is not a system, it is a mess, and the good
            lead is buried under the tire quote.
          </li>
          <li>
            <strong>A spreadsheet nobody updates.</strong> The spreadsheet is
            not the problem on day one. It is the problem on day thirty, when it
            is three weeks out of date because updating it from your phone is
            miserable and there is no reminder telling you to.
          </li>
          <li>
            <strong>Your inbox as a to-do list.</strong> A lead&rsquo;s email drops to
            the second screen and it is gone. Out of sight is out of the deal.
          </li>
        </ul>

        <h2>What a simple system actually needs</h2>
        <p>
          You do not need software with forty fields. You need four things, and
          any tool that gives you these will beat a great memory.
        </p>
        <ul>
          <li>
            <strong>One place.</strong> Every lead lives in the same list. Not
            some in your phone, some in email, some on paper. One place you check
            every morning.
          </li>
          <li>
            <strong>A stage for each lead.</strong> New, contacted, quoted, won,
            lost. You should be able to look at a lead and know in one second
            where it sits. A stage is what turns a flat list into a pipeline.
          </li>
          <li>
            <strong>A next step with a date.</strong> This is the one that saves
            deals. Every open lead has one answer to the question, what happens
            next and when. &ldquo;Call Friday.&rdquo; &ldquo;Send quote Monday.&rdquo; A lead with no
            next step is a lead you are about to lose.
          </li>
          <li>
            <strong>Fast logging.</strong> If writing down what happened takes
            longer than the call did, you will stop doing it. The record has to
            take seconds, not minutes, or the system rots.
          </li>
        </ul>

        <h2>How to set it up today</h2>
        <p>
          You can do this in the next hour. Do not wait for the perfect tool or
          the perfect Monday.
        </p>
        <ul>
          <li>
            Get every lead into one list. Empty the sticky notes, the phone
            notes, the flagged emails. All of it, into one place.
          </li>
          <li>
            Give each one a stage. Where does it actually sit right now? Be
            honest. A quote you sent three weeks ago with no reply is not &ldquo;hot,&rdquo;
            it needs a follow-up today.
          </li>
          <li>
            Give each open lead a next step and a date. This is the work. When
            you finish, every lead should have an answer for what happens next.
          </li>
          <li>
            Check the list every morning. The whole system is worthless if you
            do not open it. Two minutes with coffee. What is due today?
          </li>
        </ul>

        <h2>Where a tool like Chumley fits</h2>
        <p>
          A spreadsheet can do the four things above, sort of. The trouble is
          that it does not remind you, it fights you on a phone, and it never
          logs a call for you. That is exactly the gap{" "}
          <Link href="/">Chumley</Link> was built to close.
        </p>
        <p>
          Your leads are cards on a visual board, one column per stage, and you
          move a card when the deal moves. Each open lead carries a next step
          that turns red when it is late, so a slipping follow-up is impossible
          to miss. Tap a lead to call, text, or email, and the interaction logs
          itself with a timestamp. No form to fill in after. It runs in any
          phone browser, so the list is with you in the truck, not back at the
          desk. It is ${PRICE} per user a month, flat, and the trial is 14 days
          with no card.
        </p>
        <p>
          You do not need Chumley to stop losing leads. You need one place, a
          stage, a dated next step, and the discipline to check it. But if you
          want the reminders and the logging done for you, that is the point of
          it.
        </p>

        <h2>Common questions</h2>
        <p>
          <strong>What is the simplest way to keep track of sales leads?</strong>{" "}
          One place, a stage per lead, and a next step with a date. Add fast
          logging and you have everything that matters.
        </p>
        <p>
          <strong>How often should I follow up?</strong> Until they buy or tell
          you to stop. The job of the system is to make sure the next touch is
          always on the calendar.
        </p>
      </Prose>

      <RelatedLinks
        links={[
          {
            title: "The simplest way to track sales follow-ups from your phone",
            path: "/guides/sales-follow-up-app",
          },
          {
            title: "When a spreadsheet stops working for sales, and what replaces it",
            path: "/guides/replace-spreadsheet-with-crm",
          },
          {
            title: "Chumley for solo and independent sales reps",
            path: "/for/solo-sales-reps",
          },
        ]}
      />

      <CtaClose
        heading="Put every lead in one place"
        sub={`Chumley is $${PRICE} per user a month, flat. Move deals across a board, get reminders that turn red when late, and log calls with one tap. 14 days free, no card.`}
      />
    </>
  );
}
