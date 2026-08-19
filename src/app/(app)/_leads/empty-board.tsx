import { ArrowRight, Upload } from "lucide-react";
import Link from "next/link";
import { QuickAddLeadDialog } from "./quick-add-lead-dialog";

/**
 * First run. An empty five-column board tells a new user nothing, and the
 * whole promise is that there is nothing to learn, so the first screen has
 * to prove it: one instruction, one button.
 */
export function EmptyBoard() {
  return (
    <div className="flex flex-1 items-start justify-center overflow-y-auto px-4 py-8 md:px-6">
      <div className="w-full max-w-lg rounded-2xl bg-white p-7 text-center shadow-[0_10px_30px_-12px_rgba(9,30,66,0.4)] md:p-9">
        <h2 className="text-2xl font-bold text-[var(--board-ink)]">
          Add your first deal
        </h2>
        <p className="mx-auto mt-2 max-w-[42ch] text-[15px] leading-relaxed text-[var(--board-ink-muted)]">
          All you need is a name and a phone number. Everything else is
          optional.
        </p>

        <div className="mt-6 flex justify-center">
          <QuickAddLeadDialog variant="hero" />
        </div>

        <ol className="mx-auto mt-8 flex max-w-sm flex-col gap-3 text-left text-sm text-[var(--board-ink)]">
          {[
            "Add a deal and it lands in the first bucket.",
            "Drag it right as the deal moves along.",
            "Give it a next step so nothing gets forgotten.",
          ].map((step, i) => (
            <li key={step} className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-bold text-white">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <div className="mt-8 border-t border-slate-200 pt-5">
          <Link
            href="/settings/import"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--board-bg)] hover:underline"
          >
            <Upload className="size-4" />
            Already have a list? Bring it in from a spreadsheet
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
