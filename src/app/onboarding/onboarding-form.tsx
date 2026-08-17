"use client";

import { useActionState } from "react";
import { authButton, authInput, authLabel } from "@/components/auth-shell";
import { createTeam } from "./actions";

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState(createTeam, {
    error: null,
  });

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className={authLabel}>
          Team name
        </label>
        <input
          id="name"
          name="name"
          placeholder="Acme Sales"
          required
          autoFocus
          className={authInput}
        />
      </div>

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={authButton}>
        {pending ? "Creating..." : "Create team"}
      </button>
    </form>
  );
}
