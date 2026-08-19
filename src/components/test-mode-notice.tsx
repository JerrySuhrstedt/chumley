import { CreditCard } from "lucide-react";

/**
 * The test card, shown only while Paddle is in sandbox.
 *
 * Gated on the environment rather than a flag somebody has to remember to
 * turn off. NEXT_PUBLIC_PADDLE_ENV is baked in at build time, so the day
 * the production build goes out with it set to "production" this markup is
 * not in the bundle at all. A real customer being told to type 4242 would
 * be considerably worse than a tester not being told.
 */
export function TestModeNotice({ className = "" }: { className?: string }) {
  if (process.env.NEXT_PUBLIC_PADDLE_ENV === "production") return null;
  if (!process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN) return null;

  return (
    <div
      className={`rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-5 text-left ${className}`}
    >
      <p className="flex items-center gap-2 text-sm font-bold text-amber-900">
        <CreditCard className="size-4 shrink-0" />
        Testing only. No real money moves.
      </p>

      <p className="mt-2 text-sm leading-relaxed text-amber-900/85">
        Checkout is running in test mode, so a real card will not work and
        will not be charged. Use this one instead:
      </p>

      <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
        {[
          ["Card number", "4242 4242 4242 4242"],
          ["Security code", "100"],
          ["Expiry", "Any date in the future"],
          ["Name, email, country", "Anything you like"],
        ].map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-3 sm:justify-start">
            <dt className="text-amber-900/70">{label}</dt>
            <dd className="font-mono font-bold tracking-tight text-amber-950">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
