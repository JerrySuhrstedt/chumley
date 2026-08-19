"use client";

import { useActionState } from "react";
import { submitPublicForm, type FormState } from "./actions";

const INITIAL: FormState = { error: null, done: false };

const FIELD =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-[15px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10";

const LABEL = "text-sm font-medium text-slate-700";

/**
 * The embeddable form. Deliberately fixed: five fields, no theming, no
 * options. The only thing a team controls is the heading.
 */
export function PublicForm({
  token,
  heading,
}: {
  token: string;
  heading: string;
}) {
  const [state, formAction, pending] = useActionState(
    submitPublicForm.bind(null, token),
    INITIAL
  );

  if (state.done) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-100">
          <svg viewBox="0 0 24 24" className="size-6 text-green-700" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="mt-4 text-lg font-semibold text-slate-900">Thank you</p>
        <p className="mt-1 text-[15px] text-slate-600">
          We got your details and will be in touch shortly.
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-7"
    >
      <h1 className="text-xl font-semibold text-slate-900">{heading}</h1>

      <div className="mt-5 flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="firstName" className={LABEL}>
              First name
            </label>
            <input id="firstName" name="firstName" required autoComplete="given-name" className={FIELD} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="lastName" className={LABEL}>
              Last name
            </label>
            <input id="lastName" name="lastName" required autoComplete="family-name" className={FIELD} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className={LABEL}>
            Email
          </label>
          <input id="email" name="email" type="email" required autoComplete="email" className={FIELD} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="company" className={LABEL}>
            Company <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input id="company" name="company" autoComplete="organization" className={FIELD} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className={LABEL}>
            Phone <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" className={FIELD} />
        </div>

        {/* Honeypot. Hidden from people, irresistible to bots. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
        />

        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="h-11 w-full rounded-lg bg-slate-900 text-[15px] font-semibold text-white transition-colors hover:bg-slate-800 disabled:bg-slate-300"
        >
          {pending ? "Sending..." : "Send"}
        </button>
      </div>
    </form>
  );
}
