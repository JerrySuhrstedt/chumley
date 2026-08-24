"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cancelSubscription, resumeSubscription } from "./actions";

const when = (d: Date | null) =>
  d
    ? d.toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "the end of your billing period";

/**
 * Cancelling, and changing your mind.
 *
 * Two things are said plainly before the button, because they are the two
 * questions everybody actually has: does it stop now, and do I lose my
 * data. It stops at the end of what they have paid for, and they lose
 * nothing. Saying so is not softening the blow, it is the truth, and
 * burying it is how a cancel screen turns into a complaint.
 */
export function CancelPlan({
  endsAt,
  periodEnd,
}: {
  /** Set when a cancellation is already scheduled. */
  endsAt: Date | null;
  /** When the paid period runs out, for the confirmation copy. */
  periodEnd: Date | null;
}) {
  const [confirming, setConfirming] = useState(false);
  const [working, start] = useTransition();

  if (endsAt) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div>
          <p className="font-medium text-amber-900">
            Your plan ends on {when(endsAt)}
          </p>
          <p className="mt-1 text-sm text-amber-900/80">
            Everything keeps working until then. After that your board goes
            read-only and nothing is deleted, so you can come back to it.
          </p>
        </div>
        <Button
          variant="outline"
          className="self-start"
          loading={working}
          onClick={() =>
            start(async () => {
              const r = await resumeSubscription();
              if (r.error) toast.error(r.error);
              else toast.success("Your plan will carry on as normal.");
            })
          }
        >
          Keep my plan
        </Button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="self-start rounded text-sm font-medium text-slate-500 underline underline-offset-4 transition-colors hover:text-slate-800 focus-visible:ring-3 focus-visible:ring-slate-300 focus-visible:outline-none"
      >
        Cancel my plan
      </button>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel your plan?</DialogTitle>
            <DialogDescription>
              You keep everything until {when(periodEnd)}, which you have
              already paid for. Nothing is charged again after that.
            </DialogDescription>
          </DialogHeader>

          <ul className="flex flex-col gap-1.5 text-sm text-slate-600">
            <li>Your deals, contacts and history stay exactly as they are.</li>
            <li>After the date, the board becomes read-only. Nothing is deleted.</li>
            <li>You can export everything at any time, before or after.</li>
            <li>You can undo this from here right up until the date.</li>
          </ul>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Never mind
            </Button>
            <Button
              variant="destructive"
              loading={working}
              onClick={() =>
                start(async () => {
                  const r = await cancelSubscription();
                  if (r.error) {
                    toast.error(r.error);
                    return;
                  }
                  setConfirming(false);
                  toast.success(`Cancelled. You have Chumley until ${when(r.endsAt)}.`);
                })
              }
            >
              Cancel my plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
