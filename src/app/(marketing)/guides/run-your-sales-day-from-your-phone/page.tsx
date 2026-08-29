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

const PATH = "/guides/run-your-sales-day-from-your-phone";
const TITLE = "How to Run Your Whole Sales Day From Your Phone";
const DESC =
  "A CRM that works on your phone beats a desktop one you never open. How to log a call from the truck in ten seconds, tap to call or text, and run the day from your pocket.";

export const metadata: Metadata = pageMeta({
  title: TITLE,
  description: DESC,
  path: PATH,
});

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Guides", path: "/guides" },
  { name: "Run your sales day from your phone", path: PATH },
];

const FAQS = [
  {
    q: "Can I run a CRM from my phone?",
    a: "Yes, if you pick one built for the phone rather than a desktop CRM with a cramped mobile version bolted on. A phone-first tool lets you log a call in seconds, tap to call or text, and move a deal with a swipe.",
  },
  {
    q: "Why do reps stop using desktop CRMs?",
    a: "Because the selling happens in the field and the CRM lives at the desk. If you can only update it when you get back to the office, you will not, and a CRM you do not update is worse than no CRM.",
  },
  {
    q: "Do I need to install an app?",
    a: "Not with a browser-based tool. Chumley runs in any phone browser, and you can add it to your home screen so it opens like an app. Nothing to download, nothing to update.",
  },
];

export default function PhoneDayGuide() {
  return (
    <>
      <JsonLd data={breadcrumbLd(CRUMBS)} />
      <JsonLd data={articleLd({ headline: TITLE, description: DESC, path: PATH })} />
      <JsonLd data={faqPageLd(FAQS)} />

      <Breadcrumbs crumbs={CRUMBS} />
      <PageHero
        eyebrow="Guides"
        title={TITLE}
        sub="The best CRM is the one you actually open. For a rep in the field, that means the one in your pocket, not the one back at the desk."
        cta={false}
      />

      <Prose>
        <p>
          Think about where your day really happens. In the truck, at a job
          site, in a parking lot between appointments, standing in someone&rsquo;s
          driveway. Almost none of it happens at a desk. So why does the tool
          that is supposed to track it all live on a computer you sit down at
          twice a week?
        </p>
        <p>
          That gap is why so many field reps have given up on CRMs. Not because
          they do not want to be organized. Because the tool asked them to be
          organized in the one place they never are.
        </p>

        <h2>The field rep&rsquo;s day, honestly</h2>
        <p>
          You finish a call. You have four minutes before the next one. In those
          four minutes you are supposed to remember what was said, decide the
          next step, and note it down. If doing that means driving back to the
          office and logging into a desktop CRM, it does not happen. You tell
          yourself you will remember. By the third call, you do not.
        </p>
        <p>
          Multiply that by a week and you have a pipeline that is half fiction.
          The fix is not more discipline. It is a tool that lets you capture the
          call in the four minutes you actually have, on the device already in
          your hand.
        </p>

        <h2>Logging a call from the truck in ten seconds</h2>
        <p>
          Here is what fast looks like. You wrap the call, you pull up the deal,
          you tap one line to say what happened, and you set the next step with
          a date. Ten seconds, done, back on the road. No long form, no fifteen
          fields, no notes to type up tonight.
        </p>
        <p>
          The reason ten seconds matters is not laziness. It is that a
          ten-second task gets done every time, and a two-minute task gets
          skipped when you are busy. A CRM only works if the logging is so fast
          you never have a reason to put it off.
        </p>

        <h2>Tap to call, text, and email</h2>
        <p>
          On a phone, the number is right there. So the tool should let you tap
          a deal and call, text, or email straight away, and record that you did
          it without you lifting a finger. No copying a number into your dialer,
          no coming back to mark that you made the call. You tapped, it called,
          it logged. That is the whole point of running sales from a phone: the
          phone is already the thing you call and text with.
        </p>

        <h2>Why phone-first beats a desktop CRM you never open</h2>
        <p>
          A desktop CRM with a mobile version is not the same as a tool built
          for the phone. The bolted-on mobile view is usually a cramped copy of
          the desktop screen, tiny buttons, sideways scrolling, forms meant for
          a mouse. You will fight it, then you will stop using it.
        </p>
        <p>
          A phone-first tool turns the pipeline into something you can run with a
          thumb. In <Link href="/">Chumley</Link>, your deals are a board of cards, one
          column per stage, and on a phone the board becomes a swipe. Flick a
          deal to the right to move it forward. Tap it to call, text, or email,
          and it logs with a timestamp. The next step turns red when it is late,
          so you see what is slipping without hunting for it.
        </p>

        <h2>Add it to your home screen</h2>
        <p>
          Chumley runs in any phone browser, so there is nothing to install from
          a store and nothing to update. Open it once, add it to your home
          screen, and it sits next to your other apps and opens full screen like
          one. It is ${PRICE} per user a month, flat, and the trial is 14 days
          with no card.
        </p>
        <p>
          The test for any tool you are considering is simple. Can you run your
          whole day from your phone without ever opening a laptop? If not, you
          will end up back where you started, with a CRM you do not open and a
          pipeline you cannot trust.
        </p>
      </Prose>

      <RelatedLinks
        links={[
          {
            title: "The simplest way to track sales follow-ups from your phone",
            path: "/guides/sales-follow-up-app",
          },
          {
            title: "Why most reps quit their CRM in the first month",
            path: "/guides/why-reps-quit-their-crm",
          },
          {
            title: "Chumley for solo and independent sales reps",
            path: "/for/solo-sales-reps",
          },
        ]}
      />

      <CtaClose
        heading="Run the whole day from your pocket"
        sub={`Chumley runs in any phone browser, nothing to install. Swipe a deal forward, tap to call or text, log it in ten seconds. $${PRICE} per user a month, 14 days free, no card.`}
      />
    </>
  );
}
