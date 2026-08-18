"use client";

import { useActionState, useState } from "react";
import {
  authButton,
  authInput,
  authLabel,
  authLink,
} from "@/components/auth-shell";
import {
  sendMagicLink,
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
  type LoginState,
} from "./actions";
import { GoogleButton } from "./google-button";

type Mode = "signin" | "signup" | "magic";

const INITIAL: LoginState = { error: null, sent: false };

const COPY: Record<Mode, { title: string; cta: string; pending: string }> = {
  signin: { title: "Sign in", cta: "Sign in", pending: "Signing in..." },
  signup: {
    title: "Create your account",
    cta: "Create account",
    pending: "Creating account...",
  },
  magic: {
    title: "Sign in",
    cta: "Email me a sign-in link",
    pending: "Sending...",
  },
};

export function LoginForm({
  next,
  initialError,
}: {
  next?: string;
  initialError?: string;
}) {
  const [mode, setMode] = useState<Mode>("signin");

  const action =
    mode === "signin"
      ? signInWithPassword
      : mode === "signup"
        ? signUpWithPassword
        : sendMagicLink;

  const [state, formAction, pending] = useActionState(action, INITIAL);
  const copy = COPY[mode];
  // A failed Google round trip lands back here as ?error=, with no form state.
  const error = state.error ?? initialError ?? null;

  if (state.sent) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-slate-800">
          Check your email
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          We sent you a link to finish signing in.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-center text-2xl font-semibold text-slate-800">
        {copy.title}
      </h1>
      <p className="mt-1 text-center text-sm text-slate-600">
        {mode === "signup" ? (
          <>
            or{" "}
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={authLink}
            >
              sign in to your account
            </button>
          </>
        ) : (
          <>
            or{" "}
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={authLink}
            >
              create an account
            </button>
          </>
        )}
      </p>

      <form action={formAction} className="mt-8 flex flex-col gap-5">
        <input type="hidden" name="next" value={next ?? "/"} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className={authLabel}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            required
            autoFocus
            autoComplete="email"
            className={authInput}
          />
        </div>

        {mode !== "magic" && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className={authLabel}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder={
                mode === "signup" ? "At least 8 characters" : "Enter your password"
              }
              required
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              className={authInput}
            />
          </div>
        )}

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button type="submit" disabled={pending} className={authButton}>
          {pending ? copy.pending : copy.cta}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
          or
        </span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      {/* Its own form so the required email/password fields above do not
          block submission. */}
      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next ?? "/"} />
        <GoogleButton />
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => setMode(mode === "magic" ? "signin" : "magic")}
          className="text-sm font-semibold text-slate-600 hover:underline"
        >
          {mode === "magic"
            ? "Sign in with a password instead"
            : "Sign in a different way"}
        </button>
      </div>
    </div>
  );
}
