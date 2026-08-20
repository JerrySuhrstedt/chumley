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
import { deleteStage } from "./stage-actions";
import { CONTACT_STAGE, type BoardStage } from "./stages";
import { useStages } from "./stages-context";

/**
 * Deleting a bucket, and deciding where its deals land.
 *
 * The destination is asked for rather than assumed. Somebody removing
 * "Proposal Sent" knows where those deals belong; finding them somewhere
 * else afterwards is worse than being asked, and a deal quietly in the
 * wrong column is a deal nobody works.
 *
 * An empty bucket skips the question entirely. There is nothing to decide
 * and making somebody choose anyway is just a form to fill in.
 */
export function DeleteStageDialog({
  stage,
  leadCount,
  open,
  onOpenChange,
}: {
  stage: BoardStage;
  leadCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const allStages = useStages();
  const [saving, startSaving] = useTransition();

  const options = allStages.filter((s) => s.id !== stage.id);
  const [destination, setDestination] = useState(
    // Default to the bucket on its left, which is where a deal that is not
    // ready for the next step usually belongs.
    () => {
      const open = allStages.filter((s) => s.kind === "open");
      const index = open.findIndex((s) => s.id === stage.id);
      return (open[index - 1] ?? open.find((s) => s.id !== stage.id))?.key ?? "";
    }
  );

  function confirm() {
    startSaving(async () => {
      const result = await deleteStage(stage.id, destination);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      onOpenChange(false);
      toast.success(
        leadCount > 0
          ? `"${stage.label}" deleted. ${leadCount} ${leadCount === 1 ? "deal" : "deals"} moved to ${result.movedTo}.`
          : `"${stage.label}" deleted.`
      );
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete &ldquo;{stage.label}&rdquo;?</DialogTitle>
          <DialogDescription>
            {leadCount > 0
              ? `${leadCount} ${leadCount === 1 ? "deal is" : "deals are"} in this bucket. Nothing is deleted, they move to whichever bucket you pick.`
              : "This bucket is empty, so nothing moves."}
          </DialogDescription>
        </DialogHeader>

        {leadCount > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-slate-900">
              Move {leadCount === 1 ? "it" : "them"} to
            </p>
            <div className="flex flex-wrap gap-2">
              {options.map((s) => {
                const active = destination === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setDestination(s.key)}
                    style={
                      active
                        ? { backgroundColor: s.color, borderColor: s.color }
                        : { borderColor: s.color, color: s.color }
                    }
                    className={`rounded-full border-2 px-3 py-1.5 text-sm font-semibold transition-colors ${
                      active ? "text-white" : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    {s.key === CONTACT_STAGE ? "Contacts" : s.label}
                  </button>
                );
              })}
            </div>
            {destination === CONTACT_STAGE && (
              <p className="text-xs text-slate-500">
                They come off the board and sit in Contacts. Nothing is lost,
                and you can put any of them back later.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Keep it
          </Button>
          <Button
            variant="destructive"
            onClick={confirm}
            loading={saving}
            disabled={leadCount > 0 && !destination}
          >
            Delete bucket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
