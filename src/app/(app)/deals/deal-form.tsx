"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Company, Contact, Deal } from "@/db/schema";
import type { FormState } from "./actions";

const STAGES = [
  { value: "lead", label: "Lead" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal_sent", label: "Proposal Sent" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export function DealForm({
  action,
  deal,
  contacts,
  companies,
  submitLabel,
  onSuccess,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  deal?: Deal;
  contacts: Contact[];
  companies: Company[];
  submitLabel: string;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    async (prevState: FormState, formData: FormData) => {
      const result = await action(prevState, formData);
      if (!result.error) {
        onSuccess?.();
      }
      return result;
    },
    { error: null }
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Deal name</Label>
        <Input id="name" name="name" defaultValue={deal?.name} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            defaultValue={deal?.amount ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="closeDate">Close date</Label>
          <Input
            id="closeDate"
            name="closeDate"
            type="date"
            defaultValue={deal?.closeDate ?? ""}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="stage">Stage</Label>
        <Select name="stage" defaultValue={deal?.stage ?? "lead"}>
          <SelectTrigger id="stage" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STAGES.map((stage) => (
              <SelectItem key={stage.value} value={stage.value}>
                {stage.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="contactId">Contact</Label>
          <Select name="contactId" defaultValue={deal?.contactId ?? undefined}>
            <SelectTrigger id="contactId" className="w-full">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              {contacts.map((contact) => (
                <SelectItem key={contact.id} value={contact.id}>
                  {contact.firstName} {contact.lastName ?? ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="companyId">Company</Label>
          <Select name="companyId" defaultValue={deal?.companyId ?? undefined}>
            <SelectTrigger id="companyId" className="w-full">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
