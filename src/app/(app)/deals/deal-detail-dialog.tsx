"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { DeleteButton } from "@/components/delete-button";
import type { Activity, Company, Contact, Deal } from "@/db/schema";
import { addDealNote, deleteDeal, updateDeal } from "./actions";
import { DealForm } from "./deal-form";

type DealWithRelations = Deal & {
  contact: Contact | null;
  company: Company | null;
  activities: Activity[];
};

export function DealDetailDialog({
  deal,
  contacts,
  companies,
  open,
  onOpenChange,
}: {
  deal: DealWithRelations;
  contacts: Contact[];
  companies: Company[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const noteAction = addDealNote.bind(null, deal.id);
  const [noteState, noteFormAction, notePending] = useActionState(
    noteAction,
    { error: null }
  );
  const noteFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!noteState.error && !notePending) {
      noteFormRef.current?.reset();
    }
  }, [noteState, notePending]);

  const activities = [...deal.activities].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{deal.name}</DialogTitle>
        </DialogHeader>

        {editing ? (
          <DealForm
            action={updateDeal.bind(null, deal.id)}
            deal={deal}
            contacts={contacts}
            companies={companies}
            submitLabel="Save changes"
            onSuccess={() => setEditing(false)}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Amount: </span>
                {deal.amount ? `$${deal.amount}` : "—"}
              </div>
              <div>
                <span className="text-muted-foreground">Close date: </span>
                {deal.closeDate ?? "—"}
              </div>
              <div>
                <span className="text-muted-foreground">Contact: </span>
                {deal.contact
                  ? `${deal.contact.firstName} ${deal.contact.lastName ?? ""}`
                  : "—"}
              </div>
              <div>
                <span className="text-muted-foreground">Company: </span>
                {deal.company?.name ?? "—"}
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                Edit
              </Button>
              <DeleteButton
                action={async () => {
                  await deleteDeal(deal.id);
                  onOpenChange(false);
                }}
                confirmMessage={`Delete ${deal.name}? This can't be undone.`}
              />
            </div>

            <Separator />

            <form
              ref={noteFormRef}
              action={noteFormAction}
              className="flex flex-col gap-2"
            >
              <Textarea
                name="body"
                placeholder="Add a note..."
                rows={2}
                required
              />
              {noteState.error && (
                <p className="text-sm text-destructive">{noteState.error}</p>
              )}
              <Button
                type="submit"
                size="sm"
                className="self-end"
                disabled={notePending}
              >
                {notePending ? "Adding..." : "Add note"}
              </Button>
            </form>

            <ul className="flex max-h-48 flex-col gap-3 overflow-y-auto">
              {activities.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No activity yet.
                </p>
              )}
              {activities.map((activity) => (
                <li key={activity.id} className="text-sm">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {activity.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(activity.createdAt, {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap">{activity.body}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
