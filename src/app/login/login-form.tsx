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
  signInWithPassword,
  signUpWithPassword,
  type LoginState,
} from "./actions";

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

export function LoginForm({ next }: { next?: string }) {
  const [mode, setMode] = useState<Mode>("signin");

  const action =
    mode === "signin"
      ? signInWithPassword
      : mode === "signup"
        ? signUpWithPassword
        : sendMagicLink;

  const [state, formAction, pending] = useActionState(action, INITIAL);
  const copy = COPY[mode];

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

        {state.error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending} className={authButton}>
          {pending ? copy.pending : copy.cta}
        </button>
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
