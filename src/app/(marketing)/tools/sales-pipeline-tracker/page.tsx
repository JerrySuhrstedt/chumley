import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/meta";
import { JsonLd, breadcrumbLd, faqPageLd } from "@/lib/seo/jsonld";
import {
  Breadcrumbs,
  PageHero,
  Section,
  H2,
  Prose,
  CheckList,
  RelatedLinks,
  CtaClose,
} from "@/app/(marketing)/_components/page-kit";
import { PRICE } from "@/app/(marketing)/pricing/plans";
import { SheetPreview } from "./sheet-preview";
import { GetForm } from "./get-form";
import { Brush } from "./brush";

/**
 * The free tool page.
 *
 * Its job is not to sell. It is to rank for the highest-volume terms in the
 * whole plan (sales pipeline template, lead tracking spreadsheet and their
 * variants), to earn the links a product page never earns, and to put the
 * right person in front of Chumley six months later when their spreadsheet
 * finally gives out.
 *
 * So the sheet is genuinely good rather than deliberately hobbled. It converts
 * on its own because spreadsheets fail in three ways a spreadsheet cannot fix,
 * and saying that plainly is more persuasive than crippling the giveaway.
 */

const PATH = "/tools/sales-pipeline-tracker";
const TITLE = "Free Sales Pipeline Tracker for Google Sheets and Excel";
const DESC =
  "A free sales pipeline template that tracks deals, values and follow-ups, and turns a row pink when a next step is late. Download it for Excel, or open it in Google Sheets. No account needed.";

export const metadata: Metadata = pageMeta({
  title: TITLE,
  description: DESC,
  path: PATH,
});

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Tools", path: "/tools" },
  { name: "Sales Pipeline Tracker", path: PATH },
];

const FAQS = [
  {
    q: "Is this sales pipeline template really free?",
    a: "Yes. We ask for an email address so we can send you a copy, and that is the only thing we ask for. No card, no trial, no call. The file downloads straight from this page and it is yours to keep.",
  },
  {
    q: "Does it work in Excel as well as Google Sheets?",
    a: "Both. It downloads as a normal .xlsx, so it opens in Excel, Numbers, or LibreOffice. If you would rather work in Google Sheets there is a link for that too, and everything survives either way: the formulas, the stage dropdown and the colour rules.",
  },
  {
    q: "What are the six stages?",
    a: "New Lead, Contacted, Appointment Set, Proposal Sent, and then Won or Lost. Six is deliberate. Every extra stage is a decision you have to make about every deal for as long as you use the thing.",
  },
  {
    q: "Can I add my own columns?",
    a: "Yes. It is a spreadsheet, so change whatever you like. The only things the summary at the top depends on are the Stage, Value and Due columns, so keep those and the three numbers keep working.",
  },
  {
    q: "When does a spreadsheet stop being enough for sales?",
    a: "When you need it on your phone right after a call, when you need it to remind you rather than waiting to be opened, or when a second person needs to work from it. Those three are not spreadsheet problems and a better template will not solve them.",
  },
];

const DOES = [
  "A row turns pink when its next step is due today or already late.",
  "A row turns green the moment you mark it Won.",
  "Deals working, money won and follow-ups due all count themselves at the top.",
  "The Stage column is a dropdown, so nobody invents a seventh stage by typo.",
  "Six stages that match how a deal actually moves, not twelve that need a meeting.",
];

export default function SalesPipelineTrackerPage() {
  return (
    <>
      <JsonLd data={breadcrumbLd(CRUMBS)} />
      <JsonLd data={faqPageLd(FAQS)} />

      <Breadcrumbs crumbs={CRUMBS} />

      <PageHero
        eyebrow="Free download"
        eyebrowLarge
        titleLarge
        title={
          <>
            A <Brush>free</Brush> sales pipeline tracker that tells you who to
            call today
          </>
        }
        sub="Track deals, values and follow-ups. Late next steps turn pink so nothing quietly rots. Downloads for Excel, works in Google Sheets, and we email you a copy too."
        cta={false}
      />

      <GetForm />

      <SheetPreview />

      <Section>
        <H2>What the sheet already does</H2>
        <CheckList items={DOES} />
      </Section>

      <Section>
        <H2>The column most templates leave out</H2>
        <Prose>
          <p>
            Nearly every sales pipeline template tracks the deal. Name, company,
            value, stage. All useful, all backward-looking, and none of it tells
            you what to do when you sit down on Monday.
          </p>
          <p>
            This one has a <strong>Next step</strong> and a <strong>Due</strong>{" "}
            date on every row, and the row turns pink when that date arrives.
            The National Association of Home Builders reckons contractors lose
            somewhere between 40 and 60 percent of bids purely because nobody
            followed up. Not because the price was wrong. Because the second
            call never happened.
          </p>
          <p>
            One column fixes most of that, and it costs nothing to add.
          </p>
        </Prose>
      </Section>

      <Section>
        <H2>When this sheet stops working</H2>
        <Prose>
          <p>
            Honestly, it might not. Plenty of people run an entire book of
            business from one spreadsheet and never need anything else. If that
            is you, take the sheet and go, with our blessing.
          </p>
          <p>It gives out for three reasons, and none of them is fixable with a better spreadsheet.</p>
          <p>
            <strong>You cannot really use it on a phone.</strong> Which is where
            you are standing when the call ends and the details are still fresh.
            By the time you are back at a desk you are writing down what you
            remember, not what happened.
          </p>
          <p>
            <strong>It cannot tap you on the shoulder.</strong> The pink row only
            helps if you happen to open the file. A follow-up you forgot is
            invisible until you go looking for it.
          </p>
          <p>
            <strong>It breaks with two people.</strong> The moment somebody else
            needs to work from it, you get overwritten cells, a second copy
            named final-v3, and two versions of the truth.
          </p>
          <p>
            That is the point where a simple CRM earns its keep. Chumley is one
            screen, deals are cards you move as they move, and tapping a card to
            call or text logs it for you. ${PRICE} per user a month, flat.
          </p>
        </Prose>
      </Section>

      <Section>
        <H2>Common questions</H2>
        <Prose>
          {FAQS.map((f) => (
            <div key={f.q}>
              <p>
                <strong>{f.q}</strong>
              </p>
              <p>{f.a}</p>
            </div>
          ))}
        </Prose>
      </Section>

      <CtaClose
        heading="When the spreadsheet gives out"
        sub={`Same five columns, on your phone, and it reminds you. Chumley is $${PRICE} per user a month, flat. 14 days free, no card.`}
      />

      <RelatedLinks
        links={[
          {
            title: "When a spreadsheet stops working for sales, and what replaces it",
            path: "/guides/replace-spreadsheet-with-crm",
          },
          {
            title: "How to keep track of sales leads",
            path: "/guides/how-to-keep-track-of-sales-leads",
          },
          {
            title: "Why reps quit their CRM",
            path: "/guides/why-reps-quit-their-crm",
          },
        ]}
      />
    </>
  );
}
