import type { Metadata } from "next";
import Link from "next/link";
import { CtaButton } from "../_components/cta";
import { MerchantNotice } from "../_components/legal";
import { TRIAL_DAYS } from "./plans";
import { PlanCards } from "./plan-cards";

export const metadata: Metadata = {
  title: "Pricing | Chumley",
  description:
    "$14 per user per month. That's it: no tiers, no annual contract, no volume ladder. Everything included, and 14 days free before you pay anything.",
};

const FAQS: { q: string; a: string }[] = [
  {
    q: "What does it cost?",
    a: "Fourteen dollars per user, per month. That is the whole answer: one rep pays fourteen, a team of six pays fourteen each. There are no tiers, no annual contract and no volume math. You get 14 days free before any of that starts, and we do not ask for a card to begin.",
  },
  {
    q: "Do I have to put a card in to try it?",
    a: "No. The trial runs for 14 days without a payment method, so nothing can charge you by accident at the end of it. If you decide not to subscribe, your board simply goes read-only and your data stays put.",
  },
  {
    q: "Which plan should I pick?",
    a: "There is only one, on purpose. Every account is the entire product at the same price per person, whether that is one rep or a whole team. Nothing is ever withheld to sell you an upgrade later.",
  },
  {
    q: "What if my team grows?",
    a: "Add them and the bill follows, prorated from the day they start, at the same fourteen dollars as everyone else. Growing never changes the per-person price in either direction. Nobody has to ration logins to keep the bill down, which is how half a pipeline ends up off the board.",
  },
  {
    q: "Is there a discount for paying yearly, or for bigger teams?",
    a: "No, and that is deliberate. A yearly discount is a contract wearing a bow, and a volume ladder means the price on the page is not the price you pay. One number, always true, feels better to us and, we suspect, to you.",
  },
  {
    q: "Can I cancel?",
    a: "Any time, in one click from Settings, no email to anybody. There is no contract and no minimum term. You keep access through the period you have already paid for. If you paid and it turns out not to be for you, tell us inside 30 days and we refund it in full.",
  },
  {
    q: "What happens to my data if I stop paying?",
    a: "You keep it and you can still read it. Your board goes read-only rather than locked, and nothing is deleted. You can export everything at any time. Holding somebody's own contacts hostage is not a business model, it is a hostage situation.",
  },
  {
    q: "Is tax included in those prices?",
    a: "No. Prices are in US dollars before tax. Any sales tax or VAT owed where you are gets calculated and added at checkout, so you see the real total before you agree to it.",
  },
  {
    q: "Whose name shows up on my card statement?",
    a: "Paddle, not us. Paddle is the merchant of record for every Chumley subscription, so the line on your statement reads PADDLE.NET. If you see it and cannot place it, email us before you dispute it and we will sort it out faster than your bank will.",
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
            {TRIAL_DAYS} days free · No credit card
          </span>

          <h1 className="mt-6 text-[2.4rem] leading-[1.05] font-extrabold tracking-tight text-balance text-[var(--ink)] sm:text-5xl">
            The price is the whole pricing page
          </h1>

          <p className="mx-auto mt-5 max-w-[54ch] text-lg leading-relaxed text-[var(--ink-soft)] sm:text-xl">
            One person or a whole team, everyone pays the same and everyone
            gets everything. No tiers, no contracts, no asterisks.
          </p>

          <PlanCards />

          <p className="mt-8 text-sm text-[var(--ink-muted)]">
            Prices in US dollars, before any sales tax or VAT owed where you
            are. Cancel any time from Settings.{" "}
            <Link
              href="/refunds"
              className="font-medium text-[var(--brand)] hover:underline"
            >
              30-day money-back guarantee
            </Link>
            .
          </p>

          <MerchantNotice className="mx-auto mt-8 max-w-2xl" />
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
            {TRIAL_DAYS} days free, no card required. You will know inside five
            minutes whether your team would use it.
          </p>
          <div className="mt-9">
            <CtaButton size="xl" />
          </div>
        </div>
      </section>
    </>
  );
}
