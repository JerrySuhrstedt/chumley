import { LifeBuoy, Lock } from "lucide-react";
import { Sell1Logo } from "@/components/sell1-logo";

/**
 * What a switched-off team sees.
 *
 * Says what happened and what to do, and does not pretend the data is
 * gone. Somebody locked out of their own pipeline needs to know it still
 * exists more than they need an apology.
 */
export function Deactivated({ teamName }: { teamName: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--surface-alt)] p-6 text-center">
      <Sell1Logo className="h-7 w-auto" />

      <span className="mt-10 flex size-12 items-center justify-center rounded-full bg-slate-200">
        <Lock className="size-5 text-slate-600" />
      </span>

      <h1 className="mt-5 text-2xl font-semibold text-[var(--ink)]">
        {teamName} is switched off
      </h1>

      <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-[var(--ink-soft)]">
        Your deals, contacts and history are all still here, untouched.
        Nothing has been deleted. The account has been paused by an
        administrator, and switching it back on restores everything exactly
        as you left it.
      </p>

      <a
        href="mailto:info@sumolab.co?subject=Sell1%20account%20switched%20off"
        className="mt-7 inline-flex items-center gap-2 rounded-lg bg-[var(--brand)] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--brand-dark)]"
      >
        <LifeBuoy className="size-4" />
        Get in touch
      </a>
    </div>
  );
}
