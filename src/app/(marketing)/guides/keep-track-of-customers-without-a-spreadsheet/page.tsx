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

const PATH = "/guides/keep-track-of-customers-without-a-spreadsheet";
const TITLE = "Keeping Track of Customers Without a Spreadsheet or a Rolodex";
const DESC =
  "A plain-English guide to keeping track of customers. The difference between a contact list and a live pipeline, keeping cold contacts out of active deals, and importing what you already have.";

export const metadata: Metadata = pageMeta({
  title: TITLE,
  description: DESC,
  path: PATH,
});

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Guides", path: "/guides" },
  { name: "Keep track of customers", path: PATH },
];

const FAQS = [
  {
    q: "What is the best way to keep track of customers?",
    a: "Keep two things separate. A contact list of everyone you know, and a short list of live deals you are actively working. The contact list is your address book. The deals are what you check every day.",
  },
  {
    q: "Do I need a CRM or is a spreadsheet enough?",
    a: "If you have a handful of contacts and no active deals to chase, a spreadsheet or your phone contacts is fine. The moment you are working deals that need follow-up on certain dates, a simple tool that reminds you beats a spreadsheet that does not.",
  },
  {
    q: "Can I move my existing contacts over without retyping them?",
    a: "Yes. Export what you have to a CSV file, then import it. Chumley walks you through matching your columns to the right fields, so you are not retyping a single name.",
  },
];

export default function KeepTrackCustomersGuide() {
  return (
    <>
      <JsonLd data={breadcrumbLd(CRUMBS)} />
      <JsonLd data={articleLd({ headline: TITLE, description: DESC, path: PATH })} />
      <JsonLd data={faqPageLd(FAQS)} />

      <Breadcrumbs crumbs={CRUMBS} />
      <PageHero
        eyebrow="Guides"
        title={TITLE}
        sub="If you have never used a CRM and are not sure you need one, start here. No jargon. Just how to know who your customers are and who needs a call this week."
        cta={false}
      />

      <Prose>
        <p>
          Maybe you keep your customers in your phone contacts. Maybe in a
          spreadsheet, or a notebook, or an old card file. It worked for a long
          time. Then you hit the point where you cannot remember who you were
          supposed to call back, or you lost a good customer because you forgot
          to follow up, and now you are wondering if there is a better way.
        </p>
        <p>
          There is, and it is not complicated. You do not have to become a tech
          person. You just have to understand one distinction, and then keep two
          simple lists.
        </p>

        <h2>A contact list is not a pipeline</h2>
        <p>
          This is the whole idea, so let me be plain about it.
        </p>
        <p>
          A <strong>contact list</strong> is your address book. It is everyone
          you know: past customers, people who once asked about your work, the
          guy you met at the counter. It does not change much. You look someone
          up in it when you need their number. That is what a spreadsheet or your
          phone contacts is good at.
        </p>
        <p>
          A <strong>pipeline</strong> is different. It is the short list of deals
          you are working right now, and it changes every day. Each one has a
          stage (just talking, quoted, about to close) and a next step you owe
          them. This is the list that actually makes you money, and it is the
          one a plain contact list is bad at, because a contact list has no idea
          who is hot, who is waiting on a quote, or who you promised to call
          Friday.
        </p>
        <p>
          Trying to run your active deals out of a giant contact list is the
          mistake. The customer you need to call today is buried among four
          hundred names you will never call again.
        </p>

        <h2>Keep cold contacts separate from active deals</h2>
        <p>
          So keep them apart. Everyone you know lives in the contact list. Only
          the people you are actively selling to right now become deals on your
          pipeline. When a deal closes or dies, it moves off the active list, but
          the person stays in your contacts forever.
        </p>
        <p>
          The payoff is a short, honest list of live deals you can actually work.
          When you open it, every name on it is someone who needs something from
          you, not a name from three years ago. That is the difference between a
          list that stresses you out and one that runs your week.
        </p>
        <p>
          <Link href="/">Chumley</Link> is built around this split on purpose. Your
          contacts are one thing, kept separate. Your live deals are cards on a
          visual board, one column per stage. A cold contact does not clutter up
          the deals you are chasing, and a name never gets lost just because the
          deal ended.
        </p>

        <h2>Import what you already have</h2>
        <p>
          Here is the part people worry about most, and it is the easiest. You do
          not retype anything. Whatever you have now, a spreadsheet, an export
          from your phone, an old contact program, you save it as a CSV file
          (every spreadsheet has &ldquo;export as CSV&rdquo; or &ldquo;save as CSV&rdquo;) and import it.
        </p>
        <p>
          Chumley&rsquo;s import walks you through matching your columns to the right
          fields: this column is the name, this one is the phone, this one is the
          email. A few clicks and everyone you know is in, with nothing typed
          twice. Then you pick the handful you are actively working and put them
          on the board as deals.
        </p>

        <h2>What this looks like day to day</h2>
        <p>
          Every morning you open the board and see your live deals and what is
          due. You tap a deal to call or text, and it logs itself. When you meet
          someone new, they go in as a contact, and if you start selling to them,
          they become a deal. Nothing gets lost, and you always know who needs a
          call this week.
        </p>
        <p>
          It runs in any phone browser, nothing to install, and it is ${PRICE}{" "}
          per user a month with a 14-day free trial and no card. But the tool is
          secondary. The habit is the two lists: everyone you know in one place,
          the deals you are working in another.
        </p>
      </Prose>

      <RelatedLinks
        links={[
          {
            title: "When a spreadsheet stops working for sales, and what replaces it",
            path: "/guides/replace-spreadsheet-with-crm",
          },
          {
            title: "How to keep track of sales leads without losing half of them",
            path: "/guides/how-to-keep-track-of-sales-leads",
          },
          {
            title: "Chumley for solo and independent sales reps",
            path: "/for/solo-sales-reps",
          },
        ]}
      />

      <CtaClose
        heading="Two lists, one place"
        sub={`Keep your contacts and your live deals separate, and import what you already have in a few clicks. Chumley is $${PRICE} per user a month, 14 days free, no card.`}
      />
    </>
  );
}
