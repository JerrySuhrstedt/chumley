import type { Metadata } from "next";
import { CtaButton } from "../_components/cta";
import { TRIAL_DAYS } from "./plans";
import { PlanCards } from "./plan-cards";
import { TestModeNotice } from "@/components/test-mode-notice";

export const metadata: Metadata = {
  title: "Pricing | Sell1",
  description:
    "$19 for one person, from $15 each for a sales team, and less again as the team grows. Everything included. Free while in early access.",
};

const FAQS: { q: string; a: string }[] = [
  {
    q: "What does it cost right now?",
    a: "Nothing. Sell1 is free while we work with our first teams, and anyone who joins during early access keeps that price for a full year after we start charging. You will get plenty of notice, and no card is taken today.",
  },
  {
    q: "What is the difference between the two?",
    a: "How many people are using it, and nothing else. Both are the entire product. The team price is lower per person because a manager buying six seats is a different sale from one rep buying one, and it drops again at five and at ten. Nothing is ever withheld to sell you an upgrade later.",
  },
  {
    q: "What if my team grows?",
    a: "Add them and the bill follows, and if the new person takes you past five or ten, everybody's price drops with them. You pay for the people actually using it, so a rep who starts in March costs you from March. Nobody has to ration logins to keep the bill down, which is how half a pipeline ends up off the board.",
  },
  {
    q: "Why does the team plan start at three?",
    a: "Because otherwise it is not a team plan, it is just a discount with extra steps. Below three people the single price is the honest one.",
  },
  {
    q: "What happens to my data if I stop paying?",
    a: "You keep it and you can still read it. Your board goes read-only rather than locked, and nothing is deleted. You can export everything at any time. Holding somebody's own contacts hostage is not a business model, it is a hostage situation.",
  },
  {
    q: "Can I cancel?",
    a: "Any time, in one click, no email to anybody. There is no contract and no minimum term.",
  },
  {
    q: "Is there a setup fee, or onboarding cost?",
    a: "No, and there is nothing to set up in the first place. That is rather the point of the whole product.",
  },
];

export default function PricingPage() {
  return (
    <>
      <section className="border-b border-[var(--rule)] bg-gradient-to-b from-[var(--brand-tint)] to-white">
        <div className="mx-auto max-w-5xl px-5 pt-16 pb-20 text-center lg:px-8 lg:pt-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--brand)]/25 bg-white px-3.5 py-1.5 text-xs font-bold tracking-wide text-[var(--brand)] uppercase">
            Free while in early access
          </span>

          <h1 className="mt-6 text-[2.4rem] leading-[1.05] font-extrabold tracking-tight text-balance text-[var(--ink)] sm:text-5xl">
            Simple pricing. Everything included.
          </h1>

          <p className="mx-auto mt-5 max-w-[54ch] text-lg leading-relaxed text-[var(--ink-soft)] sm:text-xl">
            One person or a whole team. Nothing is held back on either, and
            the price per person falls as more of you use it.
          </p>

          <PlanCards />

          <TestModeNotice className="mx-auto mt-10 max-w-2xl" />

          <p className="mt-8 text-sm text-[var(--ink-muted)]">
            Nothing is charged today. Join during early access and you keep
            your price for a year once we start.
          </p>
        </div>
      </section>

      <section className="border-y border-[var(--rule)] bg-[var(--surface-alt)]">
        <div className="mx-auto max-w-3xl px-5 py-16 lg:px-8 lg:py-20">
          <h2 className="text-center text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-3xl">
            The questions people ask about the money
          </h2>

          <dl className="mt-10 flex flex-col gap-7">
            {FAQS.map((f) => (
              <div key={f.q}>
                <dt className="text-[17px] font-bold text-[var(--ink)]">
                  {f.q}
                </dt>
                <dd className="mt-1.5 max-w-[68ch] text-[16px] leading-relaxed text-[var(--ink-soft)]">
                  {f.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="bg-[var(--deep)]">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center lg:px-8 lg:py-20">
          <h2 className="text-3xl leading-tight font-extrabold tracking-tight text-balance text-white sm:text-4xl">
            Try it before any of this matters.
          </h2>
          <p className="mx-auto mt-4 max-w-[46ch] text-lg text-white/70">
            Free today, and {TRIAL_DAYS} days free whenever we do start.
            You will know inside five minutes whether your team would use it.
          </p>
          <div className="mt-9">
            <CtaButton size="xl" />
          </div>
        </div>
      </section>
    </>
  );
}
