"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Lead } from "@/db/schema";
import { completeNextAction, setNextAction } from "./actions";

export function NextActionSection({ lead }: { lead: Lead }) {
  const [editing, setEditing] = useState(false);
  const action = lead.nextActionText
    ? completeNextAction.bind(null, lead.id)
    : setNextAction.bind(null, lead.id);

  const [state, formAction, pending] = useActionState(
    async (prevState: { error: string | null }, formData: FormData) => {
      const result = await action(prevState, formData);
      if (!result.error) {
        setEditing(false);
      }
      return result;
    },
    { error: null }
  );

  if (!editing) {
    return (
      <div className="flex items-center justify-between rounded-md border p-3">
        <div>
          <p className="text-xs text-muted-foreground">What&apos;s next</p>
          {lead.nextActionText ? (
            <>
              <p className="text-sm font-medium">{lead.nextActionText}</p>
              {lead.nextActionDue && (
                <p className="text-xs text-muted-foreground">
                  Due {lead.nextActionDue}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing set yet</p>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
          {lead.nextActionText ? "Mark done" : "Set next action"}
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-md border p-3">
      {lead.nextActionText && (
        <p className="text-xs text-muted-foreground">
          Done: {lead.nextActionText} — what&apos;s next?
        </p>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="nextActionText">Next action</Label>
        <Input
          id="nextActionText"
          name="nextActionText"
          placeholder="Call to follow up"
          required
          autoFocus
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="nextActionDue">Due date</Label>
        <Input id="nextActionDue" name="nextActionDue" type="date" />
      </div>
      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
