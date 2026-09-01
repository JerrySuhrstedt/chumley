"use client";

import { useActionState, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveFormHeading, type SaveHeadingState } from "./actions";

const INITIAL: SaveHeadingState = { saved: false, error: null };

/**
 * The heading editor, with an answer. Saving used to succeed in total
 * silence, which reads as not having worked; a settings form owes the
 * person a plain "Saved". The confirmation clears the moment they type
 * again, so it can never vouch for words it has not seen.
 */
export function HeadingForm({ heading }: { heading: string }) {
  const [state, formAction, pending] = useActionState(saveFormHeading, INITIAL);
  const [editedSinceSave, setEditedSinceSave] = useState(false);

  return (
    <form
      action={formAction}
      onSubmit={() => setEditedSinceSave(false)}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="formHeading">The words above the form</Label>
        <Input
          id="formHeading"
          name="formHeading"
          defaultValue={heading}
          maxLength={80}
          placeholder="Get in touch"
          onChange={() => setEditedSinceSave(true)}
        />
        <p className="text-xs text-slate-500">
          Plain words only. Leave it empty and it says &quot;Get in
          touch&quot;.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={pending}>
          Save
        </Button>
        {state.saved && !editedSinceSave && !pending && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <Check className="size-4" />
            Saved. Your website shows it on its next load.
          </span>
        )}
        {state.error && (
          <span className="text-sm text-destructive">{state.error}</span>
        )}
      </div>
    </form>
  );
}
