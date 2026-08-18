"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Lead } from "@/db/schema";
import { completeNextAction, setNextAction } from "./actions";
import { nextActionStatus } from "./stages";

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
    // Same urgency color the card wears on the board, so the two views agree.
    const status = nextActionStatus(lead);
    const ink = status.key === "today" || status.key === "none" ? "#172b4d" : "#fff";

    return (
      <div
        className="flex items-center justify-between rounded-md p-3"
        style={{ backgroundColor: status.color, color: ink }}
      >
        <div>
          <p className="text-xs opacity-80">What&apos;s next</p>
          {lead.nextActionText ? (
            <>
              <p className="text-sm font-medium">{lead.nextActionText}</p>
              {lead.nextActionDue && (
                <p className="text-xs opacity-80">Due {lead.nextActionDue}</p>
              )}
            </>
          ) : (
            <p className="text-sm opacity-80">Nothing set yet</p>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-transparent bg-white text-[#172b4d] hover:bg-white/90 hover:text-[#172b4d]"
          onClick={() => setEditing(true)}
        >
          {lead.nextActionText ? "Mark done" : "Set next action"}
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-md border p-3">
      {lead.nextActionText && (
        <p className="text-xs text-muted-foreground">
          Done: {lead.nextActionText} ... what&apos;s next?
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
