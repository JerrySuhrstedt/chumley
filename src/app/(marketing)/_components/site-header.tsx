"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { UnCrmLogo } from "@/components/uncrm-logo";
import { CTA_LABEL } from "./cta";

const NAV = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#benefits", label: "Benefits" },
  { href: "#features", label: "Features" },
  { href: "#faqs", label: "FAQs" },
];

/**
 * Sticky top bar. Logo left, nav right, and the same call to action the
 * hero and closing sections use, so signing up is never more than one click
 * away no matter how far down the page someone has read.
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--rule)] bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 lg:px-8">
        <Link href="/" aria-label="UnCRM home" className="shrink-0">
          <UnCrmLogo className="h-7 w-auto" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-[var(--ink-soft)] transition-colors hover:text-[var(--brand)]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          <Link
            href="/login"
            className="text-sm font-semibold text-[var(--ink)] transition-colors hover:text-[var(--brand)]"
          >
            Log in
          </Link>
          <Link
            href="/login?mode=signup"
            className="rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[var(--brand-dark)]"
          >
            {CTA_LABEL}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="-mr-2 rounded-md p-2 text-[var(--ink)] md:hidden"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-[var(--rule)] bg-white md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2.5 text-base font-medium text-[var(--ink-soft)] hover:bg-[var(--surface-alt)]"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-2.5 text-base font-semibold text-[var(--ink)] hover:bg-[var(--surface-alt)]"
            >
              Log in
            </Link>
            <Link
              href="/login?mode=signup"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg bg-[var(--brand)] px-4 py-3 text-center text-base font-bold text-white"
            >
              {CTA_LABEL}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
