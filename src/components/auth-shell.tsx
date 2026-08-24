import type { ReactNode } from "react";
import Link from "next/link";
import { ChumleyLogo } from "@/components/chumley-logo";

/** Shared input styling for the auth screens. */
export const authInput =
  "h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-[15px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[var(--brand)] focus:ring-3 focus:ring-[var(--brand)]/20";

export const authLabel = "text-sm font-semibold text-slate-700";

export const authButton =
  "h-11 w-full rounded-md bg-[var(--brand)] text-[15px] font-semibold text-white transition-colors hover:bg-[var(--brand-dark)] disabled:bg-slate-200 disabled:text-slate-400";

export const authLink =
  "font-semibold text-[var(--brand)] hover:underline";

/** The real mark, linked back to the marketing page. */
export function Wordmark() {
  return (
    <Link href="/" aria-label="Chumley home" className="inline-block">
      {/* 2.925rem is h-9 (36px) plus 30%. An arbitrary value rather than
          h-11 or h-12, because neither is actually 30% and the lockup is
          the first thing on the page. */}
      <ChumleyLogo className="h-[2.925rem] w-auto" />
    </Link>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="flex flex-1 flex-col items-center px-4 pt-14 md:pt-20">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <Wordmark />
          </div>
          {children}
        </div>
      </main>

      <footer className="px-4 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Chumley
      </footer>
    </div>
  );
}
