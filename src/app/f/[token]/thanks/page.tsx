import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Thanks",
  robots: { index: false, follow: false },
};

/**
 * Where a raw HTML form lands when the customer did not name their own
 * thank-you page.
 *
 * A plain form post navigates, so something has to be on the other side. If
 * this did not exist the visitor would land on JSON, which is the sort of
 * thing that makes a small business look broken to the person who just
 * decided to trust it.
 *
 * Deliberately unbranded and noindex. It appears on a stranger's journey
 * through somebody else's website, so it should be quiet and anonymous
 * rather than an advert for us.
 */
export default function ThanksPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--surface-alt)] px-5 py-16">
      <div className="w-full max-w-md rounded-2xl border border-[var(--rule)] bg-white px-8 py-12 text-center">
        <CheckCircle2
          className="mx-auto size-11 text-[var(--brand)]"
          aria-hidden
        />
        <h1 className="mt-5 text-2xl font-bold text-[var(--ink)]">
          Thanks, that came through.
        </h1>
        <p className="mt-3 text-[var(--ink-soft)]">
          Somebody will be in touch shortly. You can close this window.
        </p>
      </div>
    </main>
  );
}
