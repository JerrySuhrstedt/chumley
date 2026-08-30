"use client";

import { useActionState, useEffect, useRef } from "react";
import { requestTracker, type SignupState } from "./actions";

const EMPTY: SignupState = { error: null, link: null };

/**
 * One field, and the sheet opens the moment it is submitted.
 *
 * The email is required, because giving away something this useful for
 * nothing in return is a missed list. What is deliberately not required is
 * going to an inbox to fetch it, or holding a Google account. The file
 * downloads from our own domain, so nothing outside this repo stands
 * between somebody and the thing they just gave their address for.
 */
export function GetForm() {
  const [state, action, pending] = useActionState(requestTracker, EMPTY);
  const opened = useRef(false);

  /**
   * Start the download the moment the link comes back.
   *
   * Same tab, not a popup: a download does not navigate anywhere, and a
   * popup blocker firing on one looks exactly like a broken button. Guarded
   * so a re-render cannot trigger it twice.
   */
  useEffect(() => {
    if (state.link && !opened.current) {
      opened.current = true;
      window.location.href = state.link;
    }
  }, [state.link]);

  if (state.link) {
    return (
      <div className="mx-auto mb-[10px] max-w-3xl px-5">
        <div className="rounded-2xl border border-[var(--rule)] bg-[var(--brand-tint)] px-6 py-8 text-center">
          <p className="text-lg font-bold text-[var(--ink)]">
            Downloading now, and a copy is in your inbox.
          </p>
          <p className="mx-auto mt-2 max-w-[48ch] text-[var(--ink-soft)]">
            It opens in Excel, Numbers, or Google Sheets. If the download did
            not start, here it is.
          </p>
          <a
            href={state.link}
            className="mt-5 inline-block rounded-xl bg-[var(--brand)] px-7 py-3.5 text-lg font-bold text-white hover:bg-[var(--brand-dark)]"
          >
            Download the tracker
          </a>
          <p className="mt-4 text-sm text-[var(--ink-muted)]">
            Prefer Google Sheets?{" "}
            <a
              href={`${state.link}&format=sheets`}
              target="_blank"
              rel="noopener"
              className="font-semibold text-[var(--brand)] underline"
            >
              Open a copy there instead
            </a>
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
          It downloads straight away too. No waiting on an inbox.
        </p>
      </form>
    </div>
  );
}
