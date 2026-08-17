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
import { createLead } from "./actions";
import type { LeadStage } from "./actions";
import { STAGES } from "./stages";

export function QuickAddLeadDialog({
  stage = "new_lead",
  variant = "button",
}: {
  stage?: LeadStage;
  variant?: "button" | "inline";
}) {
  const [open, setOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createLead, {
    error: null,
  });

  useEffect(() => {
    if (!pending && !state.error && open) {
      formRef.current?.reset();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- close the dialog once the create action succeeds
      setShowDetails(false);
      setOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, pending]);

  const stageLabel = STAGES.find((s) => s.value === stage)?.label ?? "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {variant === "inline" ? (
        <DialogTrigger className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm text-[var(--board-ink-muted)] transition-colors hover:bg-[var(--board-column-hover)] hover:text-[var(--board-ink)]">
          <Plus className="size-4" />
          Add a lead
        </DialogTrigger>
      ) : (
        <DialogTrigger
          className={buttonVariants({
            size: "lg",
            className: "h-11 w-full text-base md:h-9 md:w-auto md:text-sm",
          })}
        >
          <Plus className="size-5 md:size-4" />
          Add lead
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New lead {stageLabel && `in ${stageLabel}`}</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="stage" value={stage} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" />
            </div>
          </div>

          {showDetails ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="companyName">Company</Label>
                <Input id="companyName" name="companyName" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="value">Value</Label>
                <Input id="value" name="value" type="number" step="0.01" />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDetails(true)}
              className="self-start text-sm text-muted-foreground hover:underline"
            >
              + Add company or value
            </button>
          )}

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Adding..." : "Add lead"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
