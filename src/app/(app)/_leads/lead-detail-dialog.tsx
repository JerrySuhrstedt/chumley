"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
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
import type { Activity, Lead, Template } from "@/db/schema";
import { addLeadNote, deleteLead } from "./actions";
import { LeadEditForm } from "./lead-edit-form";
import { NextActionSection } from "./next-action-section";
import { TapToContact } from "./tap-to-contact";

type LeadWithActivities = Lead & { activities: Activity[] };

export function LeadDetailDialog({
  lead,
  templates,
  open,
  onOpenChange,
}: {
  lead: LeadWithActivities;
  templates: Template[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const noteAction = addLeadNote.bind(null, lead.id);
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

  const activities = [...lead.activities].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-lg flex-col">
        <DialogHeader>
          <DialogTitle>{lead.name}</DialogTitle>
        </DialogHeader>

        {editing ? (
          <LeadEditForm lead={lead} onSuccess={() => setEditing(false)} />
        ) : (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto pb-16 md:pb-0">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Company: </span>
                {lead.companyName ?? "—"}
              </div>
              <div>
                <span className="text-muted-foreground">Value: </span>
                {lead.value ? `$${lead.value}` : "—"}
              </div>
              <div>
                <span className="text-muted-foreground">Phone: </span>
                {lead.phone ?? "—"}
              </div>
              <div>
                <span className="text-muted-foreground">Email: </span>
                {lead.email ?? "—"}
              </div>
            </div>

            <TapToContact
              lead={lead}
              templates={templates}
              size="default"
            />

            <NextActionSection lead={lead} />

            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                Edit
              </Button>
              <DeleteButton
                action={async () => {
                  await deleteLead(lead.id);
                  onOpenChange(false);
                }}
                confirmMessage={`Delete ${lead.name}? This can't be undone.`}
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

            <ul className="flex flex-col gap-3">
              {activities.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No activity yet.
                </p>
              )}
              {activities.map((activity) => (
                <li key={activity.id} className="text-sm">
                  <p className="mb-1 text-xs text-muted-foreground">
                    {formatDistanceToNow(activity.createdAt, {
                      addSuffix: true,
                    })}
                  </p>
                  <p className="whitespace-pre-wrap">{activity.body}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!editing && (
          <div className="absolute inset-x-0 bottom-0 border-t bg-background p-3 md:hidden">
            <TapToContact lead={lead} templates={templates} size="default" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
