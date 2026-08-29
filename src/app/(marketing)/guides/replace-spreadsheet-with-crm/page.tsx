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

const PATH = "/guides/replace-spreadsheet-with-crm";
const TITLE = "When a Spreadsheet Stops Working for Sales, and What Replaces It";
const DESC =
  "A spreadsheet is fine until it is not. The exact signs your sales spreadsheet has stopped working, and how to switch to a simple CRM in an afternoon by importing a CSV.";

export const metadata: Metadata = pageMeta({
  title: TITLE,
  description: DESC,
  path: PATH,
});

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Guides", path: "/guides" },
  { name: "Replace a spreadsheet with a CRM", path: PATH },
];

const FAQS = [
  {
    q: "Is a spreadsheet good enough for tracking sales?",
    a: "For a while, yes. If you have a short list of deals, work alone, and do the follow-up from memory, a spreadsheet is honestly fine and free. It stops working when you need reminders, a history of each deal, more than one person editing it, or access from your phone.",
  },
  {
    q: "How do I switch from a spreadsheet to a CRM?",
    a: "Export the spreadsheet to a CSV file, then import it into the CRM and match your columns to its fields. In Chumley that is a guided step, and you can be up and running the same afternoon without retyping anything.",
  },
  {
    q: "Will I lose my data moving off a spreadsheet?",
    a: "No. Your spreadsheet stays right where it is. Importing a CSV copies the data in, it does not delete the original, so you always have your old file to fall back on.",
  },
];

export default function ReplaceSpreadsheetGuide() {
  return (
    <>
      <JsonLd data={breadcrumbLd(CRUMBS)} />
      <JsonLd data={articleLd({ headline: TITLE, description: DESC, path: PATH })} />
      <JsonLd data={faqPageLd(FAQS)} />

      <Breadcrumbs crumbs={CRUMBS} />
      <PageHero
        eyebrow="Guides"
        title={TITLE}
        sub="A spreadsheet is a fine place to start, and nobody should be talked out of one too early. But there is a point where it starts costing you deals. Here is how to spot it."
        cta={false}
      />

      <Prose>
        <p>
          Let me say the honest part first, because most articles like this will
          not. A spreadsheet is a genuinely good tool for tracking sales, right
          up until it is not. It is free, you already know how to use it, and for
          a solo seller with a short list of deals it does the job. If that is
          you and it is working, do not let anyone sell you software you do not
          need yet.
        </p>
        <p>
          The trouble is that a spreadsheet fails quietly. It does not break. It
          just slowly stops keeping up with you, and you lose a deal or two
          before you notice. So here are the specific signs to watch for.
        </p>

        <h2>The exact signs a spreadsheet has stopped working</h2>
        <ul>
          <li>
            <strong>Versions.</strong> There is a copy on your laptop, one your
            partner emailed back, and one on a phone. Nobody is sure which is
            current. The day you have two versions of the truth, the spreadsheet
            has already stopped being a system.
          </li>
          <li>
            <strong>No reminders.</strong> A spreadsheet will never tap you on
            the shoulder. It cannot tell you that the quote you sent two weeks
            ago has gone quiet and needs a call today. If your follow-ups depend
            entirely on you remembering to scan the rows, some will slip.
          </li>
          <li>
            <strong>No history.</strong> A cell holds one note. It cannot show
            you that you called Monday, texted Wednesday, and left a voicemail
            Friday. When you pick the phone back up, you cannot remember what was
            already said, so you sound like it is the first call.
          </li>
          <li>
            <strong>No phone.</strong> Editing a spreadsheet on a phone is
            miserable, so you wait until you are at a desk to update it, which
            means you often do not. The pipeline drifts out of date because the
            selling happens where the spreadsheet is hardest to use.
          </li>
          <li>
            <strong>More than one person.</strong> The moment a second person
            needs to see and edit the same deals, a shared spreadsheet turns into
            a game of who overwrote what. That is the clearest sign it is time.
          </li>
        </ul>
        <p>
          One of these, you can live with. Three or four at once, and the
          spreadsheet is now costing you more in lost follow-ups than a tool
          would cost in dollars.
        </p>

        <h2>What replaces it</h2>
        <p>
          Not a giant enterprise CRM with a setup project and a training manual.
          That is the overcorrection, and it fails for the opposite reason: it is
          too much. What replaces a spreadsheet is the smallest tool that fixes
          the five problems above, and nothing more.
        </p>
        <p>
          You want reminders that turn red when a follow-up is late. A history of
          every call, text, and email on each deal. Something that works on your
          phone. And a shared view so a second person sees the same pipeline
          without emailing a file around. <Link href="/">Chumley</Link> is built to be
          exactly that much and no more: a visual board of deals, a dated next
          step on each one, one-tap contact that logs itself, and contacts kept
          separate from live deals.
        </p>

        <h2>How to switch in an afternoon</h2>
        <p>
          This is the part people put off for months, and it takes about an hour.
        </p>
        <ul>
          <li>
            In your spreadsheet, choose &ldquo;save as CSV&rdquo; or &ldquo;export as CSV.&rdquo; Every
            spreadsheet program has it.
          </li>
          <li>
            Import that CSV. Chumley walks you through matching your columns to
            the right fields: this is the name, this is the phone, this is the
            deal stage.
          </li>
          <li>
            Your deals land on the board. Drag each into the right stage, and put
            a next step and a date on the open ones.
          </li>
          <li>
            Start working off the board tomorrow morning. Your spreadsheet stays
            on your computer as a backup. You did not lose a thing.
          </li>
        </ul>
        <p>
          Chumley is ${PRICE} per user a month, flat, with a 14-day free trial
          and no card, so you can move your data in and see if it fits before you
          pay anything. If it does not beat your spreadsheet, keep the
          spreadsheet. But if you recognized three of those five signs above, you
          already know it is time.
        </p>
      </Prose>

      <RelatedLinks
        links={[
          {
            title: "Keeping track of customers without a spreadsheet or a rolodex",
            path: "/guides/keep-track-of-customers-without-a-spreadsheet",
          },
          {
            title: "Why most reps quit their CRM in the first month",
            path: "/guides/why-reps-quit-their-crm",
          },
          {
            title: "A simple, single-price CRM for small teams",
            path: "/compare/less-annoying-crm",
          },
        ]}
      />

      <CtaClose
        heading="Move off the spreadsheet in an afternoon"
        sub={`Export a CSV, import it, and work off the board tomorrow. Your old file stays as a backup. Chumley is $${PRICE} per user a month, 14 days free, no card.`}
      />
    </>
  );
}
