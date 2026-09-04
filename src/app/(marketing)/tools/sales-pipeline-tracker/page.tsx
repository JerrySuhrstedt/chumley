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
import Link from "next/link";
import { Brush } from "./brush";
import { PipelineFlow, SpreadsheetBreaks } from "./visuals";

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
const TITLE = "Free Sales Pipeline Template (Google Sheets + Excel)";
const DESC =
  "A free sales pipeline template and sales tracker spreadsheet in one. Tracks deals, values and follow-ups, and turns a row pink when a next step is late. Works in Google Sheets or Excel.";

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
    q: "Can I use it as a lead tracking spreadsheet?",
    a: "Yes. A lead tracking spreadsheet and a sales pipeline tracker are the same thing under two names: a list of the people you are working, what stage each is at, and what you owe them next. This template does exactly that, so whether you call it a lead tracker or a pipeline template, it is the file you want.",
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
            The <Brush>free</Brush> sales pipeline template that tells you who
            to call today
          </>
        }
        sub="A sales tracker spreadsheet that chases the follow-up for you. Deals, values and next steps in one place, and a row turns pink when it goes late. Works in Excel or Google Sheets, and doubles as a free CRM template. We email you a copy too."
        cta={false}
      />

      <GetForm />

      <SheetPreview />

      <Section>
        <H2>What this sales pipeline template already does</H2>
        <CheckList items={DOES} />
      </Section>

      <Section>
        <H2>Six stages, not twelve</H2>
        <Prose>
          <p>
            The Stage column is a dropdown with six options, and that is the
            whole list. A deal starts at New Lead and you move it right as it
            gets closer to a yes. Every extra stage you could add is a decision
            you then have to make about every deal, forever, so this template
            does not give you the rope.
          </p>
        </Prose>
      </Section>

      <PipelineFlow />

      <Section>
        <H2>The column most templates leave out</H2>
        <Prose>
          <p>
            Nearly every sales pipeline template tracks the deal. Name, company,
            value, stage. All useful, all backward-looking, and none of it tells
            you what to do when you sit down on Monday.
          </p>
          <p>
            Some people call this a lead tracking spreadsheet, some a lead
            tracking template, some a sales pipeline template. It is the same
            file and it does the same job whatever you type into Google. The
            difference that matters is not the name, it is the next column.
          </p>
          <p>
            This one has a <strong>Next step</strong> and a <strong>Due</strong>{" "}
            date on every row, and the row turns pink when that date arrives.
            Most deals are not lost on price. They are lost because the second
            call never happened, which is the exact failure this one column is
            built to stop. It is why trades like{" "}
            <Link
              href="/for/contractors"
              className="font-semibold text-[var(--brand)] hover:underline"
            >
              contractors
            </Link>{" "}
            live or die on their follow-up.
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
        </Prose>
      </Section>

      <SpreadsheetBreaks />

      <Section>
        <Prose>
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
