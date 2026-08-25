"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Gift, MoreHorizontal, Power, Trash2, Undo2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { AdminAccount } from "@/lib/admin-data";
import {
  adminCancelSubscription,
  adminDeleteAccount,
  adminGrantComp,
  adminRevokeComp,
  adminSetActive,
} from "./actions";
import { CompDialog } from "./comp-dialog";

/**
 * Ending an account, from the back office.
 *
 * Delete asks for the team's name typed back. That is not security, the
 * action is already behind an admin gate: it is friction against the
 * wrong row being clicked in a table where every row looks alike, which
 * is the only mistake that actually happens here.
 */
export function AccountControls({ account }: { account: AdminAccount }) {
  const [confirming, setConfirming] = useState(false);
  const [comping, setComping] = useState(false);
  const [typed, setTyped] = useState("");
  const [working, start] = useTransition();

  const total =
    account.realLeads + account.sampleLeads + account.contacts;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Manage ${account.name}`}
          className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          <DropdownMenuItem
            onClick={() =>
              start(async () => {
                const r = await adminCancelSubscription(account.orgId);
                if (r.error) toast.error(r.error);
                else toast.success(r.message ?? "Cancelled.");
              })
            }
          >
            <XCircle className="size-4" />
            Cancel their plan
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              start(async () => {
                const r = await adminSetActive(
                  account.orgId,
                  account.deactivated
                );
                if (r.error) toast.error(r.error);
                else toast.success(r.message ?? "Done.");
              })
            }
          >
            <Power className="size-4" />
            {account.deactivated ? "Switch back on" : "Switch off"}
          </DropdownMenuItem>

          {account.comped ? (
            <DropdownMenuItem
              onClick={() =>
                start(async () => {
                  const r = await adminRevokeComp(account.orgId);
                  if (r.error) toast.error(r.error);
                  else toast.success(r.message ?? "Done.");
                })
              }
            >
              <Undo2 className="size-4" />
              End their free account
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setComping(true)}>
              <Gift className="size-4" />
              Give them a free account
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              setTyped("");
              setConfirming(true);
            }}
          >
            <Trash2 className="size-4" />
            Delete this account
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CompDialog
        open={comping}
        onOpenChange={setComping}
        teamName={account.name}
        ownerEmail={account.ownerEmail}
        onGrant={(reason, days) => adminGrantComp(account.orgId, reason, days)}
      />

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{account.name}&rdquo;?</DialogTitle>
            <DialogDescription>
              This cannot be undone, and nothing is archived first.
            </DialogDescription>
          </DialogHeader>

          <ul className="flex flex-col gap-1.5 text-sm text-slate-600">
            <li>
              <strong className="font-semibold text-slate-900">
                {total.toLocaleString()}
              </strong>{" "}
              leads and contacts, and{" "}
              <strong className="font-semibold text-slate-900">
                {account.activities.toLocaleString()}
              </strong>{" "}
              logged actions, are deleted.
            </li>
            <li>
              <strong className="font-semibold text-slate-900">
                {account.members}
              </strong>{" "}
              sign-in{account.members === 1 ? "" : "s"} are removed, so those
              addresses can be used again.
            </li>
            <li>
              Any live subscription is set to end at the end of the period
              they have already paid for. No refund is issued.
            </li>
            <li>
              Problems they reported are kept, so the feedback outlives the
              account.
            </li>
          </ul>

          <div className="mt-1 flex flex-col gap-1.5">
            <label htmlFor="confirm-name" className="text-sm text-slate-600">
              Type <strong className="text-slate-900">{account.name}</strong> to
              confirm
            </label>
            <Input
              id="confirm-name"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              placeholder={account.name}
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Keep it
            </Button>
            <Button
              variant="destructive"
              loading={working}
              disabled={typed.trim() !== account.name}
              onClick={() =>
                start(async () => {
                  const r = await adminDeleteAccount(account.orgId, typed);
                  if (r.error) {
                    toast.error(r.error);
                    return;
                  }
                  setConfirming(false);
                  toast.success(r.message ?? "Deleted.");
                })
              }
            >
              Delete for good
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
