"use client";

import { useState } from "react";
import { HelpCircle, Minus, Plus } from "lucide-react";

const FAQS: { q: string; a: string }[] = [
  {
    q: "I am not a computer person. Is this going to be over my head?",
    a: "No, and that is the entire point of Chumley. There is one screen. Your deals are cards. You drag a card to the right when the deal moves forward. You tap a card to call, text, or email. That is the whole thing. No required fields, no dropdowns to decode, no setup wizard, no manual. If you can use the contacts app on your phone, you already know how to use this.",
  },
  {
    q: "How long does setup take?",
    a: "About five minutes, and most of that is typing in your first few deals. There is nothing to configure because there are no settings to configure. Create your account, name your team, start adding leads. No consultant, no onboarding call, no administrator to hire. Compare that to the six weeks the last one took.",
  },
  {
    q: "Does it work on a phone?",
    a: "Yes, and that is where most people use it. Chumley runs in your phone's browser with no app to install and no app store to fight with. The board stacks into one column, cards get a move button instead of a drag, and the call, text, and email buttons hand off to your phone's own dialer and apps. You can log a call from the truck between appointments in about ten seconds.",
  },
  {
    q: "Can I bring the contacts I already have?",
    a: "Import a CSV and match your columns to ours. Imported people land in Contacts rather than your pipeline, so a thousand names from an old list do not flood the board. When one shows interest, you promote them to a lead. Your pipeline stays a list of real deals instead of a graveyard.",
  },
  {
    q: "We already pay for Salesforce. Why would we add this?",
    a: "If your people are actually logging into Salesforce every day, keep it. Chumley is for the other situation: the licenses are paid for, the logins exist, and the real pipeline is still on a legal pad. A CRM nobody opens is not a CRM, it is a line item. This one gets opened because using it is faster than not using it.",
  },
  {
    q: "What does it cost?",
    a: "Nineteen dollars a month for one person. From fifteen dollars each for a team, and less again at five people and at ten. Everything is included on both, so there is no upgrade holding the good part hostage. You get 14 days free first and we do not ask for a card to start.",
  },
];

/**
 * The virtual salesperson: answers the practical questions and settles the
 * objections that stop somebody from signing up. First item opens by
 * default because it carries the biggest objection.
 */
export function FaqList() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-[var(--rule)] overflow-hidden rounded-2xl border border-[var(--rule)] bg-white">
      {FAQS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-start gap-4 px-5 py-5 text-left transition-colors hover:bg-[var(--surface-alt)] sm:px-7"
            >
              <HelpCircle className="mt-0.5 size-5 shrink-0 text-[var(--brand)]" />
              <span className="flex-1 text-[17px] font-semibold text-[var(--ink)]">
                {item.q}
              </span>
              {isOpen ? (
                <Minus className="mt-1 size-5 shrink-0 text-[var(--ink-muted)]" />
              ) : (
                <Plus className="mt-1 size-5 shrink-0 text-[var(--ink-muted)]" />
              )}
            </button>
            {isOpen && (
              <div className="px-5 pb-6 sm:px-7 sm:pl-16">
                <p className="max-w-[68ch] text-[16px] leading-relaxed text-[var(--ink-soft)]">
                  {item.a}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
