"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Tag } from "lucide-react";
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
import { adminSetCustomPrice } from "./actions";

/**
 * Setting a negotiated price.
 *
 * Per seat per month, and said so on the field, because the number an
 * admin has in their head is usually the whole bill for one person and
 * those two are only the same while the team is one person. Getting that
 * wrong quietly is how a five-person team ends up on $2 a month in total.
 */
export function PriceDialog({
  open,
  onOpenChange,
  orgId,
  teamName,
  current,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orgId: string;
  teamName: string;
  /** Cents, when they already have one. */
  current: number | null;
}) {
  const [amount, setAmount] = useState(
    current !== null ? (current / 100).toFixed(2) : ""
  );
  const [reason, setReason] = useState("");
  const [working, start] = useTransition();

  const parsed = Number(amount.replace(/^\$/, ""));
  const valid = /^\$?\d{1,6}(\.\d{1,2})?$/.test(amount.trim()) && parsed > 0;
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
            <Tag className="size-4 text-sky-600" />
            Set a price for &ldquo;{teamName}&rdquo;
          </DialogTitle>
          <DialogDescription>
            They stay a paying customer with a real invoice. This replaces the
            published ladder for them.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="custom-amount" className="text-sm font-medium text-slate-700">
            Price per person, per month
          </label>
          <div className="relative">
            <span className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500">
              $
            </span>
            <Input
              id="custom-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="2.00"
              inputMode="decimal"
              autoComplete="off"
              className="pl-7"
            />
          </div>
          <span className="text-xs text-slate-500">
            {valid
              ? `A team of three would pay $${(parsed * 3).toFixed(2)} a month.`
              : "Per seat, not per team. Zero is not a price, use a free account for that."}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="price-reason" className="text-sm font-medium text-slate-700">
            Why?
          </label>
          <Input
            id="price-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Friends rate, my own test account, early customer..."
            autoComplete="off"
          />
        </div>

        <ul className="flex flex-col gap-1 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          <li>Monthly only. There is no yearly version of a bespoke price.</li>
          <li>
            Volume breaks stop applying to them, so the price stays put as the
            team grows.
          </li>
          <li>
            It applies when they next subscribe. An existing plan keeps the
            price it is already on.
          </li>
        </ul>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Never mind
          </Button>
          <Button
            loading={working}
            disabled={!valid || tooShort}
            onClick={() =>
              start(async () => {
                const r = await adminSetCustomPrice(orgId, amount, reason);
                if (r.error) {
                  toast.error(r.error);
                  return;
                }
                setReason("");
                onOpenChange(false);
                toast.success(r.message ?? "Done.");
              })
            }
          >
            Set the price
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
