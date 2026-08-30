"use client";

import { useActionState, useEffect, useRef } from "react";
import { requestTracker, type SignupState } from "./actions";

const EMPTY: SignupState = { error: null, link: null };

/**
 * One field, and the sheet opens the moment it is submitted.
 *
 * The email is required, because giving away something this useful for
 * nothing in return is a missed list. What is deliberately not required is
 * going to an inbox to fetch it. That second step is where most of these
 * pages lose people, and both competing pages do not gate at all, so the
 * friction has to earn its place. One field earns it. A round trip does not.
 */
export function GetForm() {
  const [state, action, pending] = useActionState(requestTracker, EMPTY);
  const opened = useRef(false);

  /**
   * Open the sheet as soon as the link comes back.
   *
   * Guarded, because a re-render must not fire a second tab. Popup blockers
   * stop this in some browsers, which is exactly why the link stays on
   * screen underneath rather than the tab being the only way through.
   */
  useEffect(() => {
    if (state.link && !opened.current) {
      opened.current = true;
      window.open(state.link, "_blank", "noopener");
    }
  }, [state.link]);

  if (state.link) {
    return (
      <div className="mx-auto mb-[10px] max-w-3xl px-5">
        <div className="rounded-2xl border border-[var(--rule)] bg-[var(--brand-tint)] px-6 py-8 text-center">
          <p className="text-lg font-bold text-[var(--ink)]">
            It is on its way to your inbox.
          </p>
          <p className="mx-auto mt-2 max-w-[46ch] text-[var(--ink-soft)]">
            It should also have opened in a new tab. If your browser blocked
            that, here it is.
          </p>
          <a
            href={state.link}
            target="_blank"
            rel="noopener"
            className="mt-5 inline-block rounded-xl bg-[var(--brand)] px-7 py-3.5 text-lg font-bold text-white hover:bg-[var(--brand-dark)]"
          >
            Open the tracker
          </a>
          <p className="mt-3 text-sm text-[var(--ink-muted)]">
            Then choose File, then Make a copy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mb-[10px] max-w-3xl px-5">
      <form
        action={action}
        className="rounded-2xl border border-[var(--rule)] bg-[var(--brand-tint)] px-6 py-8 text-center"
      >
        <p className="mx-auto max-w-[42ch] text-lg font-bold text-[var(--ink)]">
          Tell us where to send it and it is yours.
        </p>

        <div className="mx-auto mt-5 flex max-w-md flex-col gap-2.5 sm:flex-row">
          <label htmlFor="tracker-email" className="sr-only">
            Email address
          </label>
          <input
            id="tracker-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            disabled={pending}
            className="min-w-0 flex-1 rounded-xl border border-[var(--rule)] bg-white px-4 py-3.5 text-[17px] text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--brand)] focus:outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-[var(--brand)] px-6 py-3.5 text-[17px] font-bold whitespace-nowrap text-white hover:bg-[var(--brand-dark)] disabled:opacity-60"
          >
            {pending ? "Sending…" : "Send me the tracker"}
          </button>
        </div>

        {/* Bots fill in everything they find. Nobody real sees this. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
        />

        {state.error && (
          <p role="alert" className="mt-3 text-sm font-semibold text-[#b3261e]">
            {state.error}
          </p>
        )}

        <p className="mt-3 text-sm text-[var(--ink-muted)]">
          It opens straight away too. No waiting on an inbox.
        </p>
      </form>
    </div>
  );
}
