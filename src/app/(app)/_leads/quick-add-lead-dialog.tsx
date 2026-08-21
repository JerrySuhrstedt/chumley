"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/phone-input";
import { createLead } from "./actions";
import type { LeadStage } from "./actions";
import { useStages } from "./stages-context";

export function QuickAddLeadDialog({
  stage = "new_lead",
  variant = "button",
  highlight = false,
}: {
  stage?: LeadStage;
  variant?: "button" | "inline" | "hero" | "contact";
  /** Draws the eye while a board still has no real deals on it. */
  highlight?: boolean;
}) {
  const allStages = useStages();
  const [open, setOpen] = useState(false);
  // Where the person lands. Preset from wherever the dialog was opened,
  // and changeable before saving.
  const [destination, setDestination] = useState<LeadStage>(stage);
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
      setDestination(stage);
      setOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, pending]);


  // The column's own add button already says which bucket it is.
  const showPicker = variant !== "inline";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {variant === "contact" ? (
        <DialogTrigger
          className={buttonVariants({
            className: "h-10 shrink-0 whitespace-nowrap",
          })}
        >
          <Plus className="size-4" />
          Add a contact
        </DialogTrigger>
      ) : variant === "hero" ? (
        <DialogTrigger
          className={buttonVariants({
            size: "lg",
            className:
              "h-12 bg-[var(--brand)] px-7 text-base hover:bg-[var(--brand-dark)]",
          })}
        >
          <Plus className="size-5" />
          Add a deal
        </DialogTrigger>
      ) : variant === "inline" ? (
        <DialogTrigger className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm text-[var(--board-ink-muted)] transition-colors hover:bg-[var(--board-column-hover)] hover:text-[var(--board-ink)]">
          <Plus className="size-4" />
          Add a lead
        </DialogTrigger>
      ) : (
        <DialogTrigger
          // cn, not buttonVariants alone. cva concatenates, so the default
          // bg-primary stayed in the class list alongside the override and
          // won on source order. cn runs tailwind-merge, which drops the
          // one it replaces.
          className={cn(
            buttonVariants({ size: "lg" }),
            // Brand orange with a heavy black edge on a phone, where it
            // sits alone on the blue board and the default near-black
            // read as another piece of chrome. The desktop keeps the
            // default: there it sits among other controls and does not
            // need to shout.
            "h-11 w-full border-2 border-[var(--board-ink)] bg-[var(--brand)] text-base text-white hover:bg-[var(--brand-dark)]",
            "md:h-9 md:w-auto md:border md:border-transparent md:bg-primary md:text-sm md:text-primary-foreground md:hover:bg-primary/80",
            // A ring on the real control rather than a pop-up over it. It
            // points at the thing itself and disappears the moment the
            // first deal exists, so it can never become furniture.
            highlight &&
              "ring-4 ring-white/70 animate-pulse motion-reduce:animate-none"
          )}
        >
          <Plus className="size-5 md:size-4" />
          Add lead
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {showPicker
              ? "Add someone"
              : `New lead in ${allStages.find((s) => s.key === stage)?.label ?? stage}`}
          </DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="stage" value={destination} />

          {showPicker && (
            <div className="flex flex-col gap-2">
              <Label>Where does this go?</Label>
              <div className="flex flex-wrap gap-2">
                {allStages.map((s) => {
                  const active = destination === s.key;
                  const color = s.color;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setDestination(s.key)}
                      style={
                        active
                          ? { backgroundColor: color, borderColor: color }
                          : { borderColor: color, color }
                      }
                      className={`rounded-full border-2 px-3 py-1.5 text-sm font-semibold transition-colors ${
                        active ? "text-white" : "bg-white hover:bg-slate-50"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500">
                {destination === "contact"
                  ? "Contacts stay off the board until they show interest."
                  : "This puts them straight on the board."}
              </p>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Phone</Label>
              <PhoneInput id="phone" name="phone" />
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
          <Button type="submit" size="lg" loading={pending}>
            Add lead
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
