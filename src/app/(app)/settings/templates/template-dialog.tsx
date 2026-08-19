"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Template } from "@/db/schema";
import { createTemplate, updateTemplate } from "./actions";

/**
 * One dialog for both new and edit. Every saved message is editable and
 * deletable, including the two a new team starts with.
 */
export function TemplateDialog({ template }: { template?: Template }) {
  const editing = Boolean(template);
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<"sms" | "email">(
    template?.channel ?? "sms"
  );
  const formRef = useRef<HTMLFormElement>(null);

  const action = template
    ? updateTemplate.bind(null, template.id)
    : createTemplate;

  const [state, formAction, pending] = useActionState(action, { error: null });

  useEffect(() => {
    if (!pending && !state.error && open) {
      if (!editing) formRef.current?.reset();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- close once the save succeeds
      setOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, pending]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {editing ? (
        <DialogTrigger
          aria-label="Edit"
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <Pencil className="size-4" />
        </DialogTrigger>
      ) : (
        <DialogTrigger className={buttonVariants({ size: "sm" })}>
          <Plus className="size-4" />
          New message
        </DialogTrigger>
      )}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit saved message" : "New saved message"}
          </DialogTitle>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="channel" value={channel} />

          <div className="flex flex-col gap-2">
            <Label>Is this a text or an email?</Label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["sms", "Text"],
                  ["email", "Email"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setChannel(value)}
                  className={`h-10 rounded-md border text-sm font-medium transition-colors ${
                    channel === value
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">What do you call it?</Label>
            <Input
              id="name"
              name="name"
              defaultValue={template?.name ?? ""}
              placeholder="Quick follow up"
              required
            />
          </div>

          {channel === "email" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="subject">Subject line</Label>
              <Input
                id="subject"
                name="subject"
                defaultValue={template?.subject ?? ""}
                placeholder="Following up"
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              name="body"
              defaultValue={template?.body ?? ""}
              placeholder="Hi {{name}}, just following up..."
              rows={5}
              required
            />
            <p className="text-xs text-muted-foreground">
              Type {"{{name}}"} anywhere and it becomes the person&apos;s name.
            </p>
          </div>

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
