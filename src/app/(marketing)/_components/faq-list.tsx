"use client";

import { useState } from "react";
import { HelpCircle, Minus, Plus } from "lucide-react";
import { FAQS } from "./faqs";

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
