"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { CompLength } from "./actions";

/**
 * Granting a free account.
 *
 * Two decisions, and both are deliberately in front of the admin rather
 * than defaulted away: how long, and why. The reason is required because
 * the person most confused by an unexplained comp in six months is
 * whoever granted it, and there is nowhere else for that sentence to live.
 *
 * Shared by the row menu and the giveaway picker, so the wording and the
 * validation cannot drift between the two ways in.
 */
const LENGTHS: { label: string; days: CompLength }[] = [
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "A year", days: 365 },
  { label: "No end date", days: null },
];

export function CompDialog({
  open,
  onOpenChange,
  teamName,
  ownerEmail,
  onGrant,
  onGranted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  teamName: string;
  ownerEmail: string | null;
  onGrant: (
    reason: string,
    days: CompLength
  ) => Promise<{ error: string | null; message?: string }>;
  /** Lets the giveaway picker clear its pick once the comp lands. */
  onGranted?: () => void;
}) {
  const [reason, setReason] = useState("");
  const [days, setDays] = useState<CompLength>(365);
  const [working, start] = useTransition();

  const tooShort = reason.trim().length < 3;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setReason("");
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="size-4 text-violet-600" />
            Give &ldquo;{teamName}&rdquo; a free account
          </DialogTitle>
          <DialogDescription>
            Full access, billed nothing{ownerEmail ? `. Owner: ${ownerEmail}` : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">How long?</span>
          <div className="flex flex-wrap gap-2">
            {LENGTHS.map((l) => (
              <button
                key={l.label}
                type="button"
                aria-pressed={days === l.days}
                onClick={() => setDays(l.days)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  days === l.days
                    ? "border-violet-600 bg-violet-50 text-violet-800"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="comp-reason" className="text-sm font-medium text-slate-700">
            Why?
          </label>
          <Input
            id="comp-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Beta tester, launch giveaway, made it right after an outage..."
            autoComplete="off"
          />
          <span className="text-xs text-slate-500">
            Kept on the account so this is not a mystery later.
          </span>
        </div>

        <ul className="flex flex-col gap-1 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          <li>Seats are not capped while the account is free.</li>
          <li>
            If they are on a paid plan it is cancelled first, so nothing is
            charged again. They keep the period they have already paid for.
          </li>
          <li>
            You can end the free account at any time. A cancelled plan does
            not come back, so they would need to subscribe again.
          </li>
          <li>Nothing is deleted, either way.</li>
        </ul>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Never mind
          </Button>
          <Button
            loading={working}
            disabled={tooShort}
            onClick={() =>
              start(async () => {
                const r = await onGrant(reason, days);
                if (r.error) {
                  toast.error(r.error);
                  return;
                }
                setReason("");
                onOpenChange(false);
                onGranted?.();
                toast.success(r.message ?? "Done.");
              })
            }
          >
            Make it free
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
