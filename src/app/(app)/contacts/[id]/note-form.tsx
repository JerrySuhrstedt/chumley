"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addContactNote } from "../actions";

export function NoteForm({ contactId }: { contactId: string }) {
  const action = addContactNote.bind(null, contactId);
  const [state, formAction, pending] = useActionState(action, {
    error: null,
  });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.error && !pending) {
      formRef.current?.reset();
    }
  }, [state, pending]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <Textarea name="body" placeholder="Add a note..." rows={2} required />
      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" size="sm" className="self-end" disabled={pending}>
        {pending ? "Adding..." : "Add note"}
      </Button>
    </form>
  );
}
