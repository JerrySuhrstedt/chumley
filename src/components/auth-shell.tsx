import type { ReactNode } from "react";

/** Shared input styling for the auth screens. */
export const authInput =
  "h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-[15px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[var(--board-bg)] focus:ring-3 focus:ring-[var(--board-bg)]/20";

export const authLabel = "text-sm font-semibold text-slate-700";

export const authButton =
  "h-11 w-full rounded-md bg-[var(--board-bg)] text-[15px] font-semibold text-white transition-colors hover:bg-[var(--board-topbar)] disabled:bg-slate-200 disabled:text-slate-400";

export const authLink =
  "font-semibold text-[var(--board-bg)] hover:underline";

export function Wordmark() {
  return (
    <span className="text-2xl font-bold tracking-tight text-[var(--board-bg)]">
      Stupid Simple CRM
    </span>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="flex flex-1 flex-col items-center px-4 pt-14 md:pt-20">
        <div className="w-full max-w-sm">
          <div className="mb-7 text-center">
            <Wordmark />
          </div>
          {children}
        </div>
      </main>

      <footer className="px-4 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Stupid Simple CRM
      </footer>
    </div>
  );
}
