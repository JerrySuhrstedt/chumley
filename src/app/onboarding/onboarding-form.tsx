"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTeam } from "./actions";

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState(createTeam, {
    error: null,
  });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Team name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Acme Sales"
          required
          autoFocus
        />
      </div>
      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create team"}
      </Button>
    </form>
  );
}
