import type { Metadata } from "next";
import { Check, Eye, Rocket, Star, BellRing } from "lucide-react";
import Image from "next/image";
import { BoardPreview } from "./_components/board-preview";
import { CtaButton } from "./_components/cta";
import { FeatureShowcase } from "./_components/feature-showcase";
import { FaqList } from "./_components/faq-list";
import { PlatformMarquee } from "./_components/platform-marquee";
import { TRIAL_DAYS } from "./pricing/plans";

export const metadata: Metadata = {
  title: "Chumley | Ridiculously Simple Sales CRM",
  description:
    "Ridiculously simple sales CRM for independent sales reps and small sales teams. Nothing to set up, nothing to learn.",
};

const HERO_POINTS = [
  "Go from zero to tracking leads in 2 minutes",
  "Add a lead in about ten seconds",
  "Works on your phone, between phone calls",
];

const BENEFITS = [
  {
    icon: Eye,
    title: "Up and running in five minutes",
    feature:
      "No setup wizard, no fields to design, no administrator to call. Sign up, name your team, start adding deals. There is no second screen to discover later and no advanced mode. What you see on day one is the entire product.",
  },
  {
    icon: BellRing,
    title: "Adding a lead takes about ten seconds",
    feature:
      "A name and a phone number is all we require. No company record to create first, no required dropdowns, no fields with a red asterisk stopping you from saving. Everything else is optional, forever.",
  },
  {
    icon: Rocket,
    title: "You can run your whole day from your phone",
    feature:
      "It opens in your phone browser with nothing to install. Tap a card to call, text, or email, and your phone does what it always does. Log how it went in one tap, from the truck, between appointments.",
  },
];

const FEATURES = [
  ["Drag-and-drop pipeline", "Move a deal by dragging its card"],
  ["Rename any bucket", "Call your stages whatever your team calls them"],
  ["One-tap call, text, and email", "Opens your phone's own dialer and apps"],
  ["Activity logging", "Calls, emails, texts, meetings, and notes"],
  ["Call outcomes", "Connected, voicemail, no answer, bad number"],
  ["Next-step reminders", "One active next action per lead, with a due date"],
  ["Contacts kept separate", "Cold names stay off your active pipeline"],
  ["CSV import with field mapping", "Match your columns to ours, no template"],
  ["Global search", "Find anyone by name, company, or phone number"],
  ["Pipeline dashboard", "Funnel view with dollar values and close odds"],
  ["Deal values and totals", "Every bucket shows its own dollar total"],
  ["Team invites", "Send a link, they are in"],
  ["Message templates", "Pre-fill the texts and emails you send constantly"],
  ["Inbound webhook", "Connect Zapier, Make, or your website's contact form"],
  ["Works on any phone", "Runs in the browser, nothing to install"],
  ["Google sign-in", "No new password to invent and forget"],
  ["Automatic phone formatting", "Type digits, get (480) 555-0142"],
  ["Company logos pulled in", "Cards look like the businesses they represent"],
];

export default function HomePage() {
  return (
    <>
      {/* ---------------------------------------------------------------- 1. HERO */}
      {/* One screen, minus the header above it. min-h rather than h, so a
          short window or a long translation pushes the section taller
          instead of hiding the button. dvh, not vh: on a phone vh counts
          the address bar that is not there, which cuts the bottom off. */}
      <section className="relative flex min-h-[calc(100dvh-4rem)] items-center overflow-hidden border-b border-[var(--rule)] bg-gradient-to-b from-[var(--brand-tint)] to-white">
        {/* max-w-6xl, matching the header and every section below it. At 7xl
            the hero copy started 64px to the left of the logo above it, which
            is close enough to look like a mistake rather than a choice. */}
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 pt-14 pb-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-8 lg:px-8 lg:pt-16 lg:pb-16">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--brand)]/25 bg-white px-3.5 py-1.5 text-xs font-bold tracking-wide text-[var(--brand)] uppercase">
              {TRIAL_DAYS} days free · No credit card
            </span>

            {/* Two lines, always, with the category on its own. The break is
                forced at every width rather than from sm up, because the
                point is the shape of the lockup and not just fitting: the
                claim on top, what it is underneath. Sizes are the previous
                2.6/3.1/4rem plus 30%. */}
            <h1 className="mt-6 text-[3.38rem] leading-[1.02] font-extrabold tracking-tight text-[var(--ink)] sm:text-[4.03rem] xl:text-[5.2rem]">
              Ridiculously Simple
              <br />
              Sales&nbsp;CRM.
            </h1>

            {/* Names who it is for, which is the question the headline
                leaves open. */}
            <p className="mt-6 max-w-[52ch] text-[1.35rem] leading-snug font-bold text-[var(--ink)] sm:text-2xl">
              Sales CRM for independent sales reps and small sales teams.
            </p>

            {/* Its own line with air above it, rather than a break inside
                the sentence before. The two are doing different jobs: one
                says who it is for, the other says what it costs you. */}
            <p className="mt-4 max-w-[52ch] text-[1.35rem] leading-snug font-bold text-[var(--ink)] sm:text-2xl">
              Nothing to set up, nothing to learn.
            </p>

            <ul className="mt-8 space-y-3.5">
              {HERO_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]">
                    <Check className="size-3.5 text-white" strokeWidth={3.5} />
                  </span>
                  <span className="text-[17px] font-medium text-[var(--ink)]">
                    {point}
                  </span>
                </li>
              ))}
            </ul>

            {/* inline-flex keeps the block only as wide as the button, so
                centering the note centers it under the button itself. */}
            <div className="mt-9 inline-flex flex-col items-center gap-3">
              <CtaButton size="xl" />
              <span className="text-sm text-[var(--ink-muted)]">
                No credit card. Set up in minutes.
              </span>
            </div>
          </div>

          {/* Holds the column open on a wide screen so the copy keeps to
              its half. The phone itself is positioned against the section
              below, not in here. */}
          <div className="min-w-0 lg:block" aria-hidden />

          {/* Below lg the phone is in the flow, under the copy, pulled to
              the right edge. */}
          <div className="-mr-5 -mb-20 min-w-0 lg:hidden">
            <Image
              src="/chumley-hero-phone.png"
              alt="Chumley open on a phone, a deal being moved into Won"
              width={833}
              height={1200}
              priority
              sizes="88vw"
              className="ml-auto h-auto w-[88%] max-w-none sm:w-[64%]"
            />
          </div>
        </div>

        {/* From lg up it is anchored to the section rather than to a
            column inside the centred container. The section spans the
            window, so right-0 is the window's edge no matter how much
            empty space the container leaves beside it. Fixed negative
            margins could not do this: at 1920 the container centres with
            about 384px either side, and no margin large enough to cross
            that is also correct at 1280. */}
        <Image
          src="/chumley-hero-phone.png"
          alt=""
          aria-hidden
          width={833}
          height={1200}
          priority
          sizes="55vw"
          // Flush to the right edge rather than bleeding past it, and 15%
          // smaller than it was, both to buy width back for the copy. The
          // pinch is only between lg and xl: below lg the phone drops under
          // the text entirely, and by 1440 there is already a comfortable
          // gap. Aspect ratio is locked, so height is the only lever and
          // trimming it moves the left edge right by the same proportion.
          className="pointer-events-none absolute right-0 -bottom-10 hidden h-[78%] w-auto max-w-none lg:block xl:h-[92%] 2xl:h-[99%]"
        />
      </section>

      {/* ------------------------------------------------ 2. PROBLEM / SOLUTION */}
      <section id="how-it-works" className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-28">
          {/* The intro video, self-hosted: no third-party chrome, and no
              "related videos" leading a visitor off the page. Poster shows
              until they choose to play; nothing autoplays at anybody. */}
          <video
            controls
            playsInline
            preload="metadata"
            poster="/chumley-intro-poster.jpg"
            className="aspect-video w-full rounded-2xl border border-[var(--rule)] bg-black shadow-[0_18px_44px_-18px_rgba(9,30,66,0.4)]"
          >
            <source src="/chumley-intro.mp4" type="video/mp4" />
            Your browser cannot play this video.
            <a href="/chumley-intro.mp4">Download it instead.</a>
          </video>

          <div>
            <p className="text-xl leading-snug font-bold text-[var(--ink)] sm:text-2xl">
              You had a CRM. You quit by week three.
            </p>

            <p className="mt-5 max-w-[68ch] text-[17px] leading-relaxed text-[var(--ink-soft)]">
              It wanted a company record, then a contact, then an opportunity,
              before it would let you write down that Dale wants a quote. Eleven
              required fields. A dropdown nobody explained.
            </p>

            <p className="mt-5 max-w-[68ch] text-[17px] leading-relaxed text-[var(--ink-soft)]">
              So you went back to your notebook. And the CRM became one more
              thing you get asked about in the Monday meeting.
            </p>

            <p className="mt-5 max-w-[68ch] text-[17px] leading-relaxed text-[var(--ink-soft)]">
              That was not your fault. Those tools were built for somebody who
              sits at a desk all day and gets paid to keep records. You get
              paid to sell. Every minute the software takes is a minute you
              are not on the phone.
            </p>

            <p className="mt-5 max-w-[68ch] text-[17px] leading-relaxed font-semibold text-[var(--ink)]">
              Chumley is one screen. Your deals are cards. Move a card when the
              deal moves. Tap a card to call, text, or email.
            </p>

            <p className="mt-5 max-w-[68ch] text-[17px] leading-relaxed font-semibold text-[var(--ink)]">
              No required fields. Nothing to set up.
            </p>

            <p className="mt-5 max-w-[68ch] text-[17px] leading-relaxed font-semibold text-[var(--ink)]">
              You&rsquo;ll be working leads two minutes after you sign up.
            </p>

            <div className="mt-8">
              <CtaButton />
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- 3. BENEFITS */}
      <section
        id="benefits"
        // overflow-hidden because the board preview now bleeds off the
        // right edge in here. Without it the page grows a horizontal
        // scrollbar, which is the usual cost of a negative margin.
        className="overflow-hidden border-y border-[var(--rule)] bg-[var(--surface-alt)]"
      >
        <div className="mx-auto max-w-6xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-balance text-[var(--ink)] sm:text-4xl">
              Why this one sticks
            </h2>
            <p className="mt-4 text-lg text-[var(--ink-soft)]">
              Every CRM promises you a pipeline. This is the one you will still
              be using in ninety days.
            </p>
          </div>

          {/* Reasons down the left, the thing itself on the right. Each
              claim is read with the board in view rather than above a
              picture of it. */}
          <div className="mt-14 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
            <div className="flex flex-col gap-5">
              {BENEFITS.map((b) => (
                <div
                  key={b.title}
                  className="flex gap-5 rounded-2xl border border-[var(--rule)] bg-white p-6 shadow-[0_1px_2px_rgba(35,31,32,0.04)]"
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-tint)]">
                    <b.icon className="size-6 text-[var(--brand)]" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-xl leading-snug font-bold text-[var(--ink)]">
                      {b.title}
                    </h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-[var(--ink-soft)]">
                      {b.feature}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bleeds toward the right edge so all five buckets fit
                without squeezing the cards beside it. */}
            <div className="min-w-0 lg:-mr-16 xl:-mr-40">
              <BoardPreview />
            </div>
          </div>
        </div>
      </section>

      <PlatformMarquee />

      {/* ------------------------------------------------- 3b. IN THE FIELD */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
          <Image
            src="/rep-in-the-field.jpg"
            alt="A sales rep on a call, walking between appointments, phone in hand"
            width={1600}
            height={1067}
            sizes="(min-width: 1024px) 44rem, 92vw"
            className="h-auto w-full rounded-3xl object-cover shadow-[0_18px_44px_-18px_rgba(9,30,66,0.35)]"
          />
          <div>
            <p className="text-xs font-bold tracking-widest text-[var(--brand)] uppercase">
              In the field
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-balance text-[var(--ink)] sm:text-4xl">
              Built for people who sell standing up
            </h2>
            <p className="mt-5 max-w-[52ch] text-[17px] leading-relaxed text-[var(--ink-soft)]">
              Your office is the truck, the job site, the parking lot between
              appointments. Chumley was built phone-first for exactly that:
              check the board while you walk, move the deal while the
              conversation is still warm, and the call you just made is
              already on the record.
            </p>
            <p className="mt-4 max-w-[52ch] text-[17px] leading-relaxed font-semibold text-[var(--ink)]">
              The CRM fits your day. Not the other way around.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- 4. TESTIMONIALS */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-4xl">
              What the first teams say
            </h2>
            <p className="mt-4 text-lg text-[var(--ink-soft)]">
              From people already running their pipeline on Chumley.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                quote:
                  "Honestly, my non-technical sales team hated CRMs... Chumley changed that.",
                name: "Joe Pascua",
                org: "Front Door Custom Homes",
                initials: "JP",
              },
              {
                quote:
                  "Love this sales CRM... spend more time managing leads, less time managing software.",
                name: "Alex Synkevych",
                org: "Revbit Air",
                initials: "AS",
              },
              {
                quote:
                  "Finally, a simple but super effective CRM my sales team will actually use. Everything is easy!",
                name: "Petar Cale",
                org: "Sales Manager",
                initials: "PC",
              },
            ].map((t) => (
              <figure
                key={t.name}
                className="flex flex-col rounded-2xl border border-[var(--rule)] bg-[var(--surface-alt)] p-7"
              >
                <div className="flex gap-0.5" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      className="size-4 fill-[var(--brand)] text-[var(--brand)]"
                    />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-[var(--ink)]">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-[var(--brand-tint)] text-sm font-bold text-[var(--brand-dark,var(--brand))]">
                    {t.initials}
                  </span>
                  <span className="text-sm">
                    <span className="block font-semibold text-[var(--ink)]">
                      {t.name}
                    </span>
                    <span className="block text-[var(--ink-muted)]">
                      {t.org}
                    </span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- 4b. FOR THE TRADES */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
          <div className="lg:order-last">
            <Image
              src="/contractor-in-the-shop.jpg"
              alt="A contractor at his workbench following up on a bid from his laptop"
              width={1600}
              height={1067}
              sizes="(min-width: 1024px) 44rem, 92vw"
              className="h-auto w-full rounded-3xl object-cover shadow-[0_18px_44px_-18px_rgba(9,30,66,0.35)]"
            />
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest text-[var(--brand)] uppercase">
              For the trades
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-balance text-[var(--ink)] sm:text-4xl">
              The CRM for contractors who hate CRMs
            </h2>
            <p className="mt-5 max-w-[52ch] text-[17px] leading-relaxed text-[var(--ink-soft)]">
              Every estimate you send is a deal card. The follow-up call that
              wins the job is one tap from the bench, and it logs itself while
              you get back to work. No office hours, no admin night, no bid
              lost because the sticky note fell off the dash.
            </p>
            <p className="mt-4 max-w-[52ch] text-[17px] leading-relaxed font-semibold text-[var(--ink)]">
              You bid the work. Chumley remembers the rest.
            </p>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- 5. FEATURES */}
      <section
        id="features"
        className="border-y border-[var(--rule)] bg-[var(--surface-alt)]"
      >
        <div className="mx-auto max-w-6xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-4xl">
              The five things that change your week
            </h2>
            <p className="mt-4 text-lg text-[var(--ink-soft)]">
              Everything is included at every size. These are the parts you
              will feel by Friday.
            </p>
          </div>

          <div className="mt-16 lg:mt-20">
            <FeatureShowcase />
          </div>

          {/* The rest of the list, compact. The five above are the sale;
              this is the reassurance that nothing else is missing. */}
          <div className="mt-20 border-t border-[var(--rule)] pt-10 lg:mt-24">
            <p className="text-center text-sm font-bold tracking-widest text-[var(--ink-muted)] uppercase">
              And the rest, all included
            </p>
            <div className="mt-6 grid gap-x-12 gap-y-3 sm:grid-cols-2">
              {FEATURES.map(([name, detail]) => (
                <div key={name} className="flex items-start gap-3">
                  <Check
                    className="mt-1 size-4 shrink-0 text-[var(--label-upcoming)]"
                    strokeWidth={3}
                  />
                  <p className="text-[14px] leading-relaxed">
                    <span className="font-bold text-[var(--ink)]">{name}</span>
                    <span className="text-[var(--ink-soft)]"> · {detail}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- 5b. FOR THE MANAGER */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
          <div>
            <Image
              src="/manager-with-coffee.jpg"
              alt="A sales manager checking the team's numbers on his phone, coffee in hand"
              width={1600}
              height={1067}
              sizes="(min-width: 1024px) 44rem, 92vw"
              className="h-auto w-full rounded-3xl object-cover shadow-[0_18px_44px_-18px_rgba(9,30,66,0.35)]"
            />
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest text-[var(--brand)] uppercase">
              For the manager
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-balance text-[var(--ink)] sm:text-4xl">
              Know where every deal stands before you ask
            </h2>
            <p className="mt-5 max-w-[52ch] text-[17px] leading-relaxed text-[var(--ink-soft)]">
              The whole team works one board, so the answer to &ldquo;where
              are we on the Hendersons?&rdquo; is a glance, not a meeting.
              Every call and text your reps make logs itself, which means the
              pipeline you are looking at is the real one, not the one
              somebody tidied up on Friday afternoon.
            </p>
            <p className="mt-4 max-w-[52ch] text-[17px] leading-relaxed font-semibold text-[var(--ink)]">
              The Monday meeting, without the homework.
            </p>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- 6. FAQs */}
      <section id="faqs" className="bg-white">
        <div className="mx-auto max-w-4xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-4xl">
              FAQs
            </h2>
            <p className="mt-4 text-lg text-[var(--ink-soft)]">
              The questions people ask before they sign up, answered straight.
            </p>
          </div>

          <div className="mt-12">
            <FaqList />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ 6b. WORKING SOLO */}
      <section className="border-t border-[var(--rule)] bg-[var(--surface-alt)]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
          <div className="lg:order-last">
          <Image
            src="/solo-rep-at-home.jpg"
            alt="An independent salesperson on a call at her home office desk"
            width={1600}
            height={1067}
            sizes="(min-width: 1024px) 44rem, 92vw"
            className="h-auto w-full rounded-3xl object-cover shadow-[0_18px_44px_-18px_rgba(9,30,66,0.35)]"
          />
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest text-[var(--brand)] uppercase">
              Working solo
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-balance text-[var(--ink)] sm:text-4xl">
              When you are the whole sales team
            </h2>
            <p className="mt-5 max-w-[52ch] text-[17px] leading-relaxed text-[var(--ink-soft)]">
              No manager, no meetings, nobody to remind you who promised to
              call whom. Just you, a phone, and every deal you are working
              held in one place instead of across a notebook, a call log and
              your memory. Fourteen dollars a month, one seat, the whole
              product.
            </p>
            <p className="mt-4 max-w-[52ch] text-[17px] leading-relaxed font-semibold text-[var(--ink)]">
              The notebook can retire. It earned it.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- 7. FINAL CTA */}
      <section className="bg-[var(--deep)]">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center lg:px-8 lg:py-28">
          <h2 className="text-3xl leading-tight font-extrabold tracking-tight text-balance text-white sm:text-5xl">
            Nothing to set up. Nothing to learn.
          </h2>
          <p className="mx-auto mt-5 max-w-[46ch] text-lg text-white/70">
            Sign up, name your team, and put your first deal on the board in the
            next five minutes. If it takes longer than that, we did something
            wrong.
          </p>
          <div className="mt-10">
            <CtaButton size="xl" />
          </div>
          <p className="mt-5 text-sm text-white/50">
            {TRIAL_DAYS} days free. No credit card. Cancel any time.
          </p>
        </div>
      </section>
    </>
  );
}
