"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTemplate } from "./actions";

export function CreateTemplateDialog() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createTemplate, {
    error: null,
  });

  useEffect(() => {
    if (!pending && !state.error && open) {
      formRef.current?.reset();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- close the dialog once the create action succeeds
      setOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, pending]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants({ size: "sm" })}>
        <Plus className="size-4" />
        New template
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New template</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="channel">Channel</Label>
            <Select name="channel" defaultValue="sms">
              <SelectTrigger id="channel" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sms">Text (SMS)</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Template name</Label>
            <Input id="name" name="name" placeholder="Quick follow-up" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              name="body"
              placeholder="Hi {{name}}, just following up..."
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              Use {"{{name}}"} to insert the lead&apos;s name.
            </p>
          </div>
          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save template"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
