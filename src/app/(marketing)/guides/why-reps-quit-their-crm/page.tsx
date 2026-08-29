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

const PATH = "/guides/why-reps-quit-their-crm";
const TITLE = "Why Most Reps Quit Their CRM in the First Month";
const DESC =
  "Too many required fields, built for managers not sellers, slow on a phone, no payoff for the rep. The real reasons reps quit a CRM, and what a CRM that is not complicated looks like.";

export const metadata: Metadata = pageMeta({
  title: TITLE,
  description: DESC,
  path: PATH,
});

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Guides", path: "/guides" },
  { name: "Why reps quit their CRM", path: PATH },
];

const FAQS = [
  {
    q: "Why do salespeople hate CRMs?",
    a: "Because most CRMs were designed for the manager who wants reports, not the rep who has to do the typing. The rep does the data entry and the manager gets the payoff, so the rep quietly stops entering the data.",
  },
  {
    q: "What makes a CRM easy to use?",
    a: "Few required fields, fast logging, a design that works on a phone, and something in it for the seller, not just the boss. If updating a deal takes ten seconds and the tool reminds you who to call, reps keep using it.",
  },
  {
    q: "What is the simplest CRM for a small sales team?",
    a: "One built around a visual pipeline you can run from a phone, with one-tap logging and next-step reminders, and no feature tiers to climb. Chumley is $14 per user a month, flat, and takes an afternoon to set up.",
  },
];

export default function WhyRepsQuitGuide() {
  return (
    <>
      <JsonLd data={breadcrumbLd(CRUMBS)} />
      <JsonLd data={articleLd({ headline: TITLE, description: DESC, path: PATH })} />
      <JsonLd data={faqPageLd(FAQS)} />

      <Breadcrumbs crumbs={CRUMBS} />
      <PageHero
        eyebrow="Guides"
        title={TITLE}
        sub="It is not that reps are lazy or against being organized. It is that most CRMs make the rep do the work and hand the payoff to someone else. Here is the real story."
        cta={false}
      />

      <Prose>
        <p>
          A company buys a CRM. There is a kickoff, a training session, a lot of
          enthusiasm. Four weeks later the reps have quietly gone back to their
          notebooks and their memory, and the expensive CRM is a graveyard of
          half-finished records. Management blames the reps for not adopting it.
        </p>
        <p>
          That is the wrong lesson. The reps did not fail the CRM. The CRM failed
          the reps, and it usually fails them for the same four reasons.
        </p>

        <h2>The four real reasons reps quit</h2>
        <ul>
          <li>
            <strong>Too many required fields.</strong> You finish a call and want
            to log it, and the tool demands a lead source, an industry, a deal
            size, a probability percentage, and six other boxes before it will
            save. So you do not save. A required field you cannot answer in the
            moment is a wall, and reps walk away from walls.
          </li>
          <li>
            <strong>It was built for managers, not sellers.</strong> Most CRMs
            are really reporting tools wearing a sales tool&rsquo;s clothes. Every
            field exists so a manager can slice a dashboard later. None of it
            helps the rep make the next call. The person doing the data entry
            gets nothing back from it.
          </li>
          <li>
            <strong>It is slow on a phone.</strong> Selling happens in the field.
            If the CRM is a cramped desktop screen squeezed onto a phone, tiny
            buttons and sideways scrolling, the rep cannot use it where the work
            actually happens. So the updates wait for the desk, and the desk
            never comes.
          </li>
          <li>
            <strong>No payoff for the rep.</strong> This is the one under all the
            others. If the rep does the typing and only the boss gets the value,
            the rep is being asked to do unpaid admin. People do not keep doing
            that. The tool has to give the seller something back, today, in their
            own hands.
          </li>
        </ul>

        <h2>Here is the point of view</h2>
        <p>
          A CRM that reps quit is not a cheaper problem than no CRM. It is worse.
          You paid for it, you trained on it, and now you have a pipeline that is
          half empty and half wrong, which is more dangerous than an honest
          notebook, because you trust it and you should not.
        </p>
        <p>
          The mistake almost every company makes is buying the CRM with the most
          features, because more features feel like more value. For a rep, more
          features is more to fight through to log a call. The tool that gets
          used is the one that does less, faster. Simplicity is not a compromise
          here. It is the whole ballgame.
        </p>

        <h2>What a CRM a rep will actually keep looks like</h2>
        <p>
          Flip each of the four reasons around and you have the spec.
        </p>
        <ul>
          <li>
            <strong>Almost nothing is required.</strong> A name and you are in.
            You can log a call in one line and move on. The tool never blocks you
            over a field you do not have yet.
          </li>
          <li>
            <strong>It is built around the rep&rsquo;s job.</strong> The first thing
            you see is what to do next, not a report. Who is due today, which
            follow-up is late, which deal to move.
          </li>
          <li>
            <strong>It runs on a phone, well.</strong> Not a shrunken desktop. A
            board you move with your thumb, one tap to call or text, made for the
            device you actually carry.
          </li>
          <li>
            <strong>There is something in it for the seller.</strong> It reminds
            you who to call so you close more. It logs the call so you do not
            type it up tonight. The payoff lands on the rep, not just the manager.
          </li>
        </ul>
        <p>
          That is what <Link href="/">Chumley</Link> is built to be. Your deals are a
          visual board you move across, and on a phone that board becomes a
          swipe. One tap calls, texts, or emails, and logs itself with a
          timestamp. Every deal carries a next step that turns red when it is
          late, so the tool is doing the remembering for you. Contacts stay
          separate from live deals so the board stays clean. It runs in any phone
          browser with nothing to install.
        </p>
        <p>
          And the pricing follows the same idea. ${PRICE} per user a month, flat,
          everything included, no tiers to climb and no features held back. The
          trial is 14 days with no card, which is long enough to find out whether
          your reps still open it in week four. That is the only test that
          matters. A CRM the reps keep using is worth more than a powerful one
          they quit.
        </p>
      </Prose>

      <RelatedLinks
        links={[
          {
            title: "How to run your whole sales day from your phone",
            path: "/guides/run-your-sales-day-from-your-phone",
          },
          {
            title: "When a spreadsheet stops working for sales, and what replaces it",
            path: "/guides/replace-spreadsheet-with-crm",
          },
          {
            title: "A simpler, single-price CRM compared to Less Annoying CRM",
            path: "/compare/less-annoying-crm",
          },
        ]}
      />

      <CtaClose
        heading="A CRM your reps will actually keep"
        sub={`Few required fields, fast logging, built for the phone, with a payoff for the seller. Chumley is $${PRICE} per user a month, flat. 14 days free, no card.`}
      />
    </>
  );
}
