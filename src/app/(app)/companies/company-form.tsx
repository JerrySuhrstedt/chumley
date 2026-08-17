"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Company } from "@/db/schema";
import type { FormState } from "./actions";

export function CompanyForm({
  action,
  company,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  company?: Company;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {
    error: null,
  });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={company?.name} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="domain">Domain</Label>
        <Input
          id="domain"
          name="domain"
          placeholder="acme.com"
          defaultValue={company?.domain ?? ""}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={company?.notes ?? ""}
        />
      </div>
      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
