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
  signInWithLinkedIn,
  signInWithPassword,
  signUpWithPassword,
  type LoginState,
} from "./actions";
import { Loader2, Mail } from "lucide-react";
import { OAuthButton } from "./oauth-buttons";

/**
 * "magic" is one action with two meanings. The same emailed link both
 * creates an account and signs an existing person in, because
 * sendMagicLink passes shouldCreateUser. What has to change is the
 * wording: somebody creating an account should not be shown a panel
 * headed "Sign in".
 */
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
    title: "No password needed",
    cta: "Email me a sign-in link",
    pending: "Sending...",
  },
};

export function LoginForm({
  next,
  initialError,
  initialMode = "signin",
}: {
  next?: string;
  initialError?: string;
  initialMode?: Mode;
}) {
  // The marketing page links straight to signup, so honour ?mode=signup.
  const [mode, setMode] = useState<Mode>(initialMode);
  // Where the magic-link panel came from, so leaving it returns there
  // rather than always dropping people on the sign-in form.
  const [cameFrom, setCameFrom] = useState<"signin" | "signup">(
    initialMode === "signup" ? "signup" : "signin"
  );

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
          We sent you a link. Open it on this device and you are in. No
          password to choose, and nothing else to fill in.
        </p>
        <p className="mt-3 text-xs text-slate-500">
          It can take a minute to arrive. Check spam if it does not.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-center text-2xl font-semibold text-slate-800">
        {copy.title}
      </h1>
      {/* Not shown on the link panel. That one already creates accounts,
          so offering "create an account" beside it implies it does not,
          and the way back to a password sits under the form. */}
      <p className="mt-1 text-center text-sm text-slate-600">
        {mode === "magic" ? (
          "One link. It signs you in, or sets you up if you are new."
        ) : mode === "signup" ? (
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
        <input type="hidden" name="next" value={next ?? "/pipeline"} />

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

        <button
          type="submit"
          disabled={pending}
          aria-busy={pending || undefined}
          className={authButton}
        >
          {pending && (
            <Loader2
              className="mr-2 inline size-4 animate-spin align-[-3px]"
              aria-hidden="true"
            />
          )}
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

      {/* Each provider gets its own form, so the required email and password
          fields above do not block submission and each button tracks only its
          own pending state. */}
      <div className="flex flex-col gap-3">
        <form action={signInWithGoogle}>
          <input type="hidden" name="next" value={next ?? "/pipeline"} />
          <OAuthButton provider="google" />
        </form>

        <form action={signInWithLinkedIn}>
          <input type="hidden" name="next" value={next ?? "/pipeline"} />
          <OAuthButton provider="linkedin" />
        </form>

        {mode !== "magic" && (
          <button
            type="button"
            onClick={() => {
              setCameFrom(mode === "signup" ? "signup" : "signin");
              setMode("magic");
            }}
            className="flex w-full items-center justify-center gap-2.5 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Mail className="size-[18px] text-slate-500" aria-hidden="true" />
            {mode === "signup"
              ? "Sign up with an emailed link"
              : "Email me a sign-in link"}
          </button>
        )}
      </div>

      {mode === "magic" && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setMode(cameFrom)}
            className="text-sm font-semibold text-slate-600 hover:underline"
          >
            Use a password instead
          </button>
        </div>
      )}
    </div>
  );
}
