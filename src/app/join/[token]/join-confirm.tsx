"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { joinOrg, type JoinState } from "./actions";

const INITIAL: JoinState = { error: null };

/**
 * The one deliberate click that accepts an invite. On success the action
 * redirects to the board; only a real refusal (full team, already
 * elsewhere) comes back here as text.
 */
export function JoinConfirm({
  token,
  orgName,
}: {
  token: string;
  orgName: string;
}) {
  const action = joinOrg.bind(null, token);
  const [state, formAction, pending] = useActionState(action, INITIAL);

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-slate-800">
          Join {orgName}?
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          You were invited to this team&apos;s Chumley board.
        </p>
      </div>

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-center text-sm text-red-700">
          {state.error}
        </p>
      )}

      <form action={formAction}>
        <Button type="submit" size="lg" className="w-full" loading={pending}>
          Join {orgName}
        </Button>
      </form>
    </div>
  );
}
