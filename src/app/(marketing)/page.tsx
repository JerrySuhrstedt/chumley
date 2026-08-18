import type { Metadata } from "next";
import {
  Check,
  Eye,
  PlayCircle,
  Rocket,
  Star,
  BellRing,
} from "lucide-react";
import { BoardPreview } from "./_components/board-preview";
import { CtaButton } from "./_components/cta";
import { FaqList } from "./_components/faq-list";

export const metadata: Metadata = {
  title: "UnCRM | Finally, a CRM you'll actually use",
  description:
    "Stupid simple on purpose. Add a name and a phone number, drag a card when the deal moves, done. No setup, no training, no manual. If you can use your phone, you can use UnCRM.",
};

const HERO_POINTS = [
  "Nothing to set up, nothing to learn",
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
      <section className="relative overflow-hidden border-b border-[var(--rule)] bg-gradient-to-b from-[var(--brand-tint)] to-white">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 pt-16 pb-20 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-14 lg:px-8 lg:pt-24 lg:pb-28">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--brand)]/25 bg-white px-3.5 py-1.5 text-xs font-bold tracking-wide text-[var(--brand)] uppercase">
              Free while in early access
            </span>

            <h1 className="mt-6 text-[2.6rem] leading-[1.04] font-extrabold tracking-tight text-balance text-[var(--ink)] sm:text-[3.4rem] xl:text-[3.9rem]">
              Finally, a CRM you&apos;ll actually use.
            </h1>

            <p className="mt-6 max-w-[52ch] text-[1.35rem] leading-relaxed text-[var(--ink-soft)] sm:text-2xl">
              UnCRM is stupid simple on purpose. Add a name and a phone
              number, drag a card when the deal moves, and you are done. No
              setup, no training, no manual. If you can use your phone, you can
              use this.
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

            <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <CtaButton size="xl" />
              <span className="text-sm text-[var(--ink-muted)]">
                No credit card. Set up in minutes.
              </span>
            </div>
          </div>

          {/* Bleeds toward the right edge so all five buckets fit without
              shrinking the type beside it. */}
          <div className="min-w-0 lg:-mr-16 lg:pl-4 xl:-mr-56">
            <BoardPreview />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ 2. PROBLEM / SOLUTION */}
      <section id="how-it-works" className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-28">
          {/* Best spot on the page for a video. Placeholder until Jerry records one. */}
          <div className="flex aspect-video items-center justify-center rounded-2xl border-2 border-dashed border-[var(--rule)] bg-[var(--surface-alt)]">
            <div className="px-6 text-center">
              <PlayCircle className="mx-auto size-14 text-[var(--brand)]/45" />
              <p className="mt-3 text-sm font-semibold text-[var(--ink-soft)]">
                Video slot
              </p>
              <p className="mx-auto mt-1 max-w-[34ch] text-xs text-[var(--ink-muted)]">
                A 60 to 90 second walkthrough goes here. Pages with video
                convert markedly better, and this is the strongest spot for it.
              </p>
            </div>
          </div>

          <div>
            <p className="text-xl leading-snug font-bold text-[var(--ink)] sm:text-2xl">
              You have been handed a CRM before. You quit using it by week
              three.
            </p>

            <p className="mt-5 max-w-[68ch] text-[17px] leading-relaxed text-[var(--ink-soft)]">
              It wanted a company record, then a contact record, then an
              opportunity record, all before it would let you write down that
              Dale wants a quote. Eleven required fields. A dropdown nobody ever
              explained. So you went back to your notebook, and the CRM turned
              into one more thing you get asked about in the Monday meeting.
            </p>

            <p className="mt-5 max-w-[68ch] text-[17px] leading-relaxed text-[var(--ink-soft)]">
              That was not your fault. Those tools were built for somebody who
              sits at a desk all day and gets paid to keep records. You get paid
              to sell. Every minute the software takes is a minute you are not
              on the phone.
            </p>

            <p className="mt-5 max-w-[68ch] text-[17px] leading-relaxed font-semibold text-[var(--ink)]">
              UnCRM is one screen. Your deals are cards. Move a card when the
              deal moves. Tap a card to call, text, or email. There are no
              required fields, no records to create first, and no settings to
              figure out. Most people are running it about two minutes after
              they sign up. That is the whole product.
            </p>

            <div className="mt-8">
              <CtaButton />
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- 3. BENEFITS */}
      <section id="benefits" className="border-y border-[var(--rule)] bg-[var(--surface-alt)]">
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

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-[var(--rule)] bg-white p-7 shadow-[0_1px_2px_rgba(35,31,32,0.04)]"
              >
                <span className="flex size-12 items-center justify-center rounded-xl bg-[var(--brand-tint)]">
                  <b.icon className="size-6 text-[var(--brand)]" />
                </span>
                <h3 className="mt-5 text-xl leading-snug font-bold text-[var(--ink)]">
                  {b.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-soft)]">
                  {b.feature}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- 4. TESTIMONIALS */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-4xl">
              Testimonials
            </h2>
            <p className="mt-4 text-lg text-[var(--ink-soft)]">
              Three short quotes from real customers go here, each one settling
              a different objection.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              "Answers the objection: I am not a computer person.",
              "Answers the objection: we tried a CRM and nobody stuck with it.",
              "Answers the objection: it is too simple to matter.",
            ].map((hint, i) => (
              <div
                key={hint}
                className="flex flex-col rounded-2xl border-2 border-dashed border-[var(--rule)] bg-[var(--surface-alt)] p-7"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      className="size-4 fill-[var(--label-none)] text-[var(--label-none)]"
                    />
                  ))}
                </div>
                <p className="mt-4 flex-1 text-[15px] leading-relaxed text-[var(--ink-muted)] italic">
                  &ldquo;Customer quote {i + 1}. {hint}&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <span className="size-10 rounded-full bg-[var(--rule)]" />
                  <span className="text-sm">
                    <span className="block font-semibold text-[var(--ink-soft)]">
                      Name, title
                    </span>
                    <span className="block text-[var(--ink-muted)]">
                      Company, city
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-10 max-w-[60ch] rounded-xl border border-[var(--brand)]/20 bg-[var(--brand-tint)] px-5 py-4 text-center text-sm text-[var(--ink-soft)]">
            <strong className="font-semibold text-[var(--ink)]">
              Placeholder, on purpose.
            </strong>{" "}
            UnCRM has no customers yet, so there are no real testimonials to
            print. Invented ones would be a fake review. Replace these three
            after your first users, and add a review-site line underneath.
          </p>
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
              Everything that comes with it
            </h2>
            <p className="mt-4 text-lg text-[var(--ink-soft)]">
              No tiers, no add-ons, no upsell at the point you need something.
            </p>
          </div>

          <div className="mt-14 grid gap-x-12 gap-y-5 sm:grid-cols-2">
            {FEATURES.map(([name, detail]) => (
              <div key={name} className="flex items-start gap-3">
                <Check
                  className="mt-1 size-5 shrink-0 text-[var(--label-upcoming)]"
                  strokeWidth={3}
                />
                <p className="text-[15px] leading-relaxed">
                  <span className="font-bold text-[var(--ink)]">{name}</span>
                  <span className="text-[var(--ink-soft)]"> · {detail}</span>
                </p>
              </div>
            ))}
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

      {/* ---------------------------------------------------------- 7. FINAL CTA */}
      <section className="bg-[var(--deep)]">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center lg:px-8 lg:py-28">
          <h2 className="text-3xl leading-tight font-extrabold tracking-tight text-balance text-white sm:text-5xl">
            Nothing to set up. Nothing to learn.
          </h2>
          <p className="mx-auto mt-5 max-w-[46ch] text-lg text-white/70">
            Sign up, name your team, and put your first deal on the board in
            the next five minutes. If it takes longer than that, we did
            something wrong.
          </p>
          <div className="mt-10">
            <CtaButton size="xl" />
          </div>
          <p className="mt-5 text-sm text-white/50">
            Free while in early access. No credit card.
          </p>
        </div>
      </section>
    </>
  );
}
