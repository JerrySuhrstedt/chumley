"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { submitReview, type ReviewFormState } from "./review-actions";

/**
 * The "how are we doing?" card. Fifteen seconds to fill in, one per
 * user, editable later. Where it goes after that is a human decision in
 * the back office, and the consent box is what makes showing it
 * anywhere legitimate.
 */
export function ReviewCard({
  defaultRating,
  defaultQuote,
  defaultName,
  defaultCompany,
  hadReview,
}: {
  defaultRating: number;
  defaultQuote: string;
  defaultName: string;
  defaultCompany: string;
  hadReview: boolean;
}) {
  const [rating, setRating] = useState(defaultRating);
  const [state, formAction, pending] = useActionState<ReviewFormState, FormData>(
    submitReview,
    { error: null, saved: false }
  );

  if (state.saved) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="text-sm font-semibold text-emerald-900">
          Thank you. That genuinely helps.
        </p>
        <p className="mt-1 text-sm text-emerald-800">
          {rating === 5
            ? "We may feature it on our site, exactly as you wrote it."
            : "We read every one of these, and it lands directly with the person who builds Chumley."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="font-medium text-slate-900">
        {hadReview ? "Your review of Chumley" : "How are we doing?"}
      </p>
      <p className="mt-1 text-sm text-slate-600">
        A rating and a sentence. It helps more than you would think.
      </p>

      <form action={formAction} className="mt-4 flex flex-col gap-3">
        <input type="hidden" name="rating" value={rating} />
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              onClick={() => setRating(n)}
              className="p-0.5"
            >
              <Star
                className={`size-7 transition-colors ${
                  n <= rating
                    ? "fill-[var(--brand)] text-[var(--brand)]"
                    : "text-slate-300"
                }`}
              />
            </button>
          ))}
        </div>

        <textarea
          name="quote"
          defaultValue={defaultQuote}
          maxLength={280}
          rows={3}
          placeholder="What would you tell another salesperson about Chumley?"
          className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            name="name"
            defaultValue={defaultName}
            placeholder="Name to show"
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[var(--brand)]"
          />
          <input
            name="company"
            defaultValue={defaultCompany}
            placeholder="Company or title (optional)"
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[var(--brand)]"
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-slate-600">
          <input type="checkbox" name="consent" defaultChecked className="mt-0.5" />
          You may show this on chumley.app with my name.
        </label>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending || rating === 0}
          className="h-10 self-start rounded-lg bg-[var(--brand)] px-5 text-sm font-bold text-white hover:bg-[var(--brand-dark)] disabled:opacity-50"
        >
          {pending ? "Saving..." : hadReview ? "Update review" : "Send it"}
        </button>
      </form>
    </div>
  );
}
