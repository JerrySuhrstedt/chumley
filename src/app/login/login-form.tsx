"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  sendMagicLink,
  signInWithPassword,
  signUpWithPassword,
  type LoginState,
} from "./actions";

type Mode = "signin" | "signup" | "magic";

const INITIAL: LoginState = { error: null, sent: false };

export function LoginForm({ next }: { next?: string }) {
  const [mode, setMode] = useState<Mode>("signin");

  const action =
    mode === "signin"
      ? signInWithPassword
      : mode === "signup"
        ? signUpWithPassword
        : sendMagicLink;

  const [state, formAction, pending] = useActionState(action, INITIAL);

  if (state.sent) {
    return (
      <p className="text-sm text-neutral-300">
        Check your email to finish signing in.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next ?? "/"} />

        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-neutral-200">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoFocus
            autoComplete="email"
          />
        </div>

        {mode !== "magic" && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-neutral-200">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
            />
          </div>
        )}

        {state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        <Button type="submit" size="lg" disabled={pending}>
          {pending
            ? "Working..."
            : mode === "signin"
              ? "Sign in"
              : mode === "signup"
                ? "Create account"
                : "Email me a link"}
        </Button>
      </form>

      <div className="flex flex-col gap-1 text-sm text-neutral-400">
        {mode !== "signup" && (
          <button
            type="button"
            onClick={() => setMode("signup")}
            className="text-left hover:text-neutral-200 hover:underline"
          >
            New here? Create an account
          </button>
        )}
        {mode !== "signin" && (
          <button
            type="button"
            onClick={() => setMode("signin")}
            className="text-left hover:text-neutral-200 hover:underline"
          >
            Already have an account? Sign in
          </button>
        )}
        {mode !== "magic" && (
          <button
            type="button"
            onClick={() => setMode("magic")}
            className="text-left hover:text-neutral-200 hover:underline"
          >
            Email me a sign-in link instead
          </button>
        )}
      </div>
    </div>
  );
}
