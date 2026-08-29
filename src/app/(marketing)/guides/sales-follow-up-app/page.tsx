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

const PATH = "/guides/sales-follow-up-app";
const TITLE = "The Simplest Way to Track Sales Follow-Ups From Your Phone";
const DESC =
  "Follow-up is where deals are won and lost. What to look for in a sales follow-up app, and how to actually work a follow-up list so nothing goes cold.";

export const metadata: Metadata = pageMeta({
  title: TITLE,
  description: DESC,
  path: PATH,
});

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Guides", path: "/guides" },
  { name: "Sales follow-up app", path: PATH },
];

const FAQS = [
  {
    q: "What should a sales follow-up app do?",
    a: "Three things. Give every follow-up a due date that reminds you when it is late, let you call, text, or email in one tap, and work on your phone. Everything else is extra.",
  },
  {
    q: "How do I keep track of follow-ups without forgetting?",
    a: "Put a date on every one and let the tool nag you. A follow-up you have to remember is a follow-up you will forget. A follow-up with a reminder that turns red when it is overdue is one you will actually make.",
  },
  {
    q: "How many times should I follow up before giving up?",
    a: "More than once. Most sales take several touches, and a lot of reps quit after the first no-answer. Keep the follow-up scheduled until the deal closes or the customer tells you to stop.",
  },
];

export default function FollowUpAppGuide() {
  return (
    <>
      <JsonLd data={breadcrumbLd(CRUMBS)} />
      <JsonLd data={articleLd({ headline: TITLE, description: DESC, path: PATH })} />
      <JsonLd data={faqPageLd(FAQS)} />

      <Breadcrumbs crumbs={CRUMBS} />
      <PageHero
        eyebrow="Guides"
        title={TITLE}
        sub="The deal is rarely won on the first call. It is won on the fourth follow-up nobody else bothered to make. Here is how to be the one who makes it."
        cta={false}
      />

      <Prose>
        <p>
          Ask any salesperson who has been at it a while where the money is, and
          they will tell you the same thing. It is in the follow-up. The first
          call gets you in the door. The follow-up is where the deal actually
          closes, and it is also where most deals quietly die.
        </p>
        <p>
          The numbers back it up. A large share of sales need several touches
          before someone buys, and a large share of reps stop after one or two.
          So the follow-ups you make after everyone else has given up are, in
          plain terms, free money. The only trick is remembering to make them.
        </p>

        <h2>Why follow-up is where deals are won and lost</h2>
        <p>
          A cold lead is not usually a lead that said no. It is a lead you never
          got back to. The customer got busy, you got busy, and the thread went
          quiet. Whoever picks it back up first tends to win, because they look
          like the one who actually wants the business.
        </p>
        <p>
          The whole game, then, is making sure no open deal ever sits without a
          scheduled next touch. Do that and you will close more than reps who
          are better talkers than you.
        </p>

        <h2>What to look for in a follow-up tool</h2>
        <p>
          Do not overthink this. A follow-up tool needs three things, and most
          of what gets sold as a CRM buries these under features you will never
          use.
        </p>
        <ul>
          <li>
            <strong>A due date that nags you.</strong> Every follow-up gets a
            date. When that date passes and you have not done it, the tool
            should make it loud. A reminder you can ignore silently is no
            reminder. You want the overdue one to turn red and stare at you.
          </li>
          <li>
            <strong>One-tap contact.</strong> When it is time to follow up, you
            should be one tap from calling, texting, or emailing. If reaching
            the customer takes copying a number into your phone, you have added
            friction, and friction is where follow-ups die.
          </li>
          <li>
            <strong>It works on your phone.</strong> Follow-ups do not happen at
            a desk. They happen between jobs, in the parking lot, waiting on a
            coffee. If the tool is not good on a phone, you will not use it when
            it counts.
          </li>
        </ul>

        <h2>How to actually work a follow-up list</h2>
        <p>
          A tool does not close deals. A habit does. Here is the habit that
          turns a follow-up list into money.
        </p>
        <ul>
          <li>
            <strong>Open the list every morning.</strong> First thing. What is
            due today? That is your call list before anything else grabs you.
          </li>
          <li>
            <strong>Never end a call without setting the next one.</strong> The
            moment you hang up, put a date on the next touch. &ldquo;Call back
            Tuesday.&rdquo; Do it right then, while you remember why.
          </li>
          <li>
            <strong>Log what happened in one line.</strong> &ldquo;Left voicemail.&rdquo;
            &ldquo;Wants pricing on the bigger unit.&rdquo; Next time you call, you sound
            like you remember them, because you do.
          </li>
          <li>
            <strong>Clear the overdue ones first.</strong> An overdue follow-up
            is a deal actively slipping. Handle those before you touch anything
            new.
          </li>
        </ul>

        <h2>Where Chumley comes in</h2>
        <p>
          <Link href="/">Chumley</Link> was built around exactly this. Every deal
          carries a next step with a date, and when that date passes the next
          step turns red, so an overdue follow-up is impossible to scroll past.
          Tap the deal to call, text, or email, and the touch logs itself with a
          timestamp. No form, no notes to type up later. It runs in any phone
          browser, so your follow-up list is in your pocket, not on a desktop
          you open twice a week.
        </p>
        <p>
          It is ${PRICE} per user a month, flat, everything included, and the
          trial is 14 days with no card. But even if you use something else, the
          rule stands. Put a date on every follow-up and let the tool remind
          you. That one habit closes more deals than any script.
        </p>
      </Prose>

      <RelatedLinks
        links={[
          {
            title: "How to keep track of sales leads without losing half of them",
            path: "/guides/how-to-keep-track-of-sales-leads",
          },
          {
            title: "How to run your whole sales day from your phone",
            path: "/guides/run-your-sales-day-from-your-phone",
          },
          {
            title: "Chumley for solo and independent sales reps",
            path: "/for/solo-sales-reps",
          },
        ]}
      />

      <CtaClose
        heading="Never miss a follow-up again"
        sub={`Chumley puts a dated next step on every deal and turns it red when it is late. One tap to call or text, and it logs itself. $${PRICE} per user a month, 14 days free, no card.`}
      />
    </>
  );
}
