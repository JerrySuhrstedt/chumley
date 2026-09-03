import type { Metadata } from "next";
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

const PATH = "/guides/do-i-need-a-crm";
const TITLE = "Do I Need a CRM? A Straight Answer for Solo Reps and Small Teams";
const DESC =
  "Probably not yet, and here is exactly when that changes. An honest yes-or-no on whether you need a CRM, what one actually is, and what to look for if you do.";

export const metadata: Metadata = pageMeta({
  title: TITLE,
  description: DESC,
  path: PATH,
});

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Guides", path: "/guides" },
  { name: "Do I need a CRM?", path: PATH },
];

const FAQS = [
  {
    q: "Do I really need a CRM, or is a spreadsheet enough?",
    a: "If you work alone, track a short list of deals, and never drop a follow-up, a spreadsheet is genuinely fine and it is free. You start needing a CRM when you cannot hold every next step in your head, when a forgotten follow-up has cost you real money, or when a second person needs to work the same list.",
  },
  {
    q: "What is a CRM, in plain English?",
    a: "It is a list of the people you are trying to sell to, plus what you said last and what you are supposed to do next. That is the whole idea. Everything else a CRM does is built on top of that one list. The word stands for customer relationship management, which sounds bigger than it is.",
  },
  {
    q: "How much does a CRM cost?",
    a: `They range from free to well over a hundred dollars a person a month. The expensive ones are built for big teams and most of what you pay for is features you will never open. A simple one runs around ten to twenty dollars a person. Chumley is $${PRICE} per person, flat, with everything included.`,
  },
  {
    q: "When is it too early for a CRM?",
    a: "When you have a handful of deals, you are the only person selling, and nothing is slipping through. Buying software to solve a problem you do not have yet is just a subscription you will cancel. Start with a free spreadsheet and switch when it starts costing you.",
  },
];

export default function DoINeedACrmGuide() {
  return (
    <>
      <JsonLd data={breadcrumbLd(CRUMBS)} />
      <JsonLd data={articleLd({ headline: TITLE, description: DESC, path: PATH })} />
      <JsonLd data={faqPageLd(FAQS)} />

      <Breadcrumbs crumbs={CRUMBS} />
      <PageHero
        eyebrow="Guides"
        title={TITLE}
        sub="Most articles asking this question are secretly trying to sell you the CRM. This one is not. The honest answer for a lot of people is not yet, and it is worth knowing where that line actually is."
        cta={false}
      />

      <Prose>
        <p>
          Here is the short version. You probably do not need a CRM if you are
          selling on your own, you are tracking somewhere south of a dozen live
          deals, and you are not dropping the follow-up. A notebook or a
          spreadsheet does that job, it costs nothing, and there is no shame in
          it. Plenty of people run a good living exactly that way.
        </p>
        <p>
          You start needing one when your memory becomes the database. That is
          the real line, and it has nothing to do with how big your company is.
          It is about how many things you are trying to hold in your head at
          once, and how much it costs you when one of them falls out.
        </p>

        <h2>The four signs you have crossed the line</h2>
        <p>
          You do not need all four. Nod along to two of these and it is time.
        </p>
        <ul>
          <li>
            <strong>You have forgotten to follow up, and it cost you.</strong> Not
            a maybe. An actual deal that went cold because the second call never
            happened and you only realised weeks later. That is the single most
            expensive habit in sales, and it is the one a spreadsheet cannot fix,
            because a spreadsheet waits to be opened. It never taps you on the
            shoulder.
          </li>
          <li>
            <strong>You cannot hold your deals in your head anymore.</strong> When
            somebody asks what is happening with a particular customer and you
            have to think hard, or worse, you draw a blank, your memory has hit
            its limit. For most people that is somewhere around fifteen or twenty
            open deals.
          </li>
          <li>
            <strong>Somebody else needs to see the list.</strong> A partner, a
            new hire, an assistant. The moment two people work from one
            spreadsheet you get overwritten cells, a copy named final-v3, and two
            versions of the truth. This is the point where a shared system stops
            being optional.
          </li>
          <li>
            <strong>You do most of your selling away from a desk.</strong> If the
            call ends and you are standing in a parking lot, a spreadsheet on a
            laptop at home is no use to you. By the time you get back to it, you
            are writing down what you remember, not what happened.
          </li>
        </ul>

        <h2>What a CRM actually is, minus the jargon</h2>
        <p>
          People hear CRM and picture something enterprise and complicated,
          because the loudest ones are. Strip all that away and a CRM is a list
          of the people you are trying to sell to, with two things attached to
          each one: what you said last, and what you are supposed to do next.
        </p>
        <p>
          That is it. That is the whole thing. A good CRM keeps that list
          current, reminds you when a next step is due, and lets you make the
          call or send the text without copying a number out somewhere else.
          Everything past that is extra, and most of the extra is what makes the
          expensive ones a pain to use.
        </p>

        <h2>If you do need one, what to actually look for</h2>
        <p>
          The mistake is reaching for the biggest name you have heard of. Those
          are built for sales teams of fifty with a person whose whole job is
          running the CRM. For a solo rep or a small crew, three things matter
          and the rest is noise.
        </p>
        <ul>
          <li>
            <strong>You can start in a coffee break.</strong> If it needs an
            afternoon of setup and a week of new habits before it gives anything
            back, you will quit it by week three. Most people do.
          </li>
          <li>
            <strong>It works on your phone.</strong> Not a shrunk-down version of
            a desktop screen. Something you can actually log a call on, one
            handed, standing up.
          </li>
          <li>
            <strong>The price is one flat number.</strong> No tier that hides the
            feature you need behind a bigger plan, no per-feature upsell. You
            should be able to say what it costs in one sentence.
          </li>
        </ul>
        <p>
          That is the whole checklist. If a CRM clears those three, it will get
          used, which is the only test that matters. The best CRM is the one you
          still open in month three.
        </p>

        <h2>Not sure yet? Start with the free version of the answer</h2>
        <p>
          If you are on the fence, do not buy anything. Grab a free sales
          pipeline template, run your deals through it for a month, and pay
          attention to where it hurts. If nothing hurts, you have your answer and
          you saved the money. If it starts costing you a deal, you will know
          exactly which of the four signs pushed you over, and you will know what
          to look for when you switch.
        </p>
      </Prose>

      <CtaClose
        heading="When a spreadsheet stops being enough"
        sub={`Chumley is the simple end of the CRM world. One screen, works on your phone, $${PRICE} per person a month, flat. 14 days free, no card.`}
      />

      <RelatedLinks
        links={[
          {
            title: "A free sales pipeline template for Google Sheets and Excel",
            path: "/tools/sales-pipeline-tracker",
          },
          {
            title: "When a spreadsheet stops working for sales, and what replaces it",
            path: "/guides/replace-spreadsheet-with-crm",
          },
          {
            title: "Why most reps quit their CRM in the first month",
            path: "/guides/why-reps-quit-their-crm",
          },
        ]}
      />
    </>
  );
}
