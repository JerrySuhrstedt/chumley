"use client";

import { useActionState } from "react";
import { submitTicket, type TicketState } from "./actions";
import { TOPICS } from "./topics";

const EMPTY: TicketState = { error: null, sent: false };

const FIELD =
  "w-full rounded-xl border border-[var(--rule)] bg-white px-4 py-3 text-[16px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-muted)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20";

const LABEL = "block text-sm font-semibold text-[var(--ink)]";

/**
 * A contact form that says who it reached and when to expect an answer.
 *
 * The success state names the address the reply will come from, because the
 * most common thing that goes wrong after a support form is not that nobody
 * replied, it is that the reply landed in spam and nobody knew to look.
 */
export function TicketForm() {
  const [state, action, pending] = useActionState(submitTicket, EMPTY);

  if (state.sent) {
    return (
      <div className="rounded-2xl border border-[var(--rule)] bg-[var(--brand-tint)] px-6 py-10 text-center">
        <p className="text-lg font-bold text-[var(--ink)]">
          Got it. We will come back to you.
        </p>
        <p className="mx-auto mt-2 max-w-[46ch] text-[var(--ink-soft)]">
          Usually the same day, and always within one business day. The reply
          comes from info@sumolab.co, so if it is not in your inbox in a day,
          it is worth a look in spam.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      {/* Bots fill in every field they find. Nobody real sees this one. */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="support-website">Leave this empty</label>
        <input id="support-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={LABEL} htmlFor="support-name">
            Your name
          </label>
          <input
            id="support-name"
            name="name"
            autoComplete="name"
            className={`mt-2 ${FIELD}`}
            placeholder="Jane Whitfield"
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="support-email">
            Email <span className="font-normal text-[var(--ink-muted)]">(required)</span>
          </label>
          <input
            id="support-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={`mt-2 ${FIELD}`}
            placeholder="you@company.com"
          />
        </div>
      </div>

      <div>
        <label className={LABEL} htmlFor="support-topic">
          What is this about?
        </label>
        <select id="support-topic" name="topic" defaultValue={TOPICS[0]} className={`mt-2 ${FIELD}`}>
          {TOPICS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={LABEL} htmlFor="support-message">
          What is going on?
        </label>
        <textarea
          id="support-message"
          name="message"
          required
          rows={6}
          className={`mt-2 ${FIELD} resize-y`}
          placeholder="If something is broken, tell us what you did, what you expected, and what happened instead. It gets you a real answer instead of a follow-up question."
        />
      </div>

      {state.error && (
        <p role="alert" className="text-[15px] font-semibold text-[var(--danger,#b42318)]">
          {state.error}
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[var(--brand)] px-6 py-3 text-[16px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Sending..." : "Send it"}
        </button>
        <p className="mt-3 text-sm text-[var(--ink-muted)]">
          Goes to a person, not a queue. Same day answer, most days.
        </p>
      </div>
    </form>
  );
}
