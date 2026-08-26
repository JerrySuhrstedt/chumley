"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { FileSpreadsheet } from "lucide-react";
import { fireConfetti } from "@/lib/confetti";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { saveName, type NameState } from "./actions";

/**
 * The only thing we ask a new user to type about themselves.
 *
 * Two fields, nothing else. The email is already known from signing in, so
 * asking for it again would be a form that punishes somebody for having
 * already answered. Splitting the profile down to this and leaving job
 * title, photo and company for Settings is the same trade Houzz made when
 * it broke one signup form into several and conversions went up: friction
 * removed from the moment that matters, spent somewhere it does not.
 *
 * It appears after the first real deal is added, never before. Asking for
 * personal details before the product has done anything is the request
 * every abandoned signup has in common.
 */
export function NameStep({
  open,
  onOpenChange,
  defaultFirst = "",
  defaultLast = "",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultFirst?: string;
  defaultLast?: string;
}) {
  const router = useRouter();
  // Null until the name has saved; then the dialog turns into the
  // celebration, and this carries the name they just typed into it.
  const [savedName, setSavedName] = useState<string | null>(null);

  const [state, formAction, pending] = useActionState<NameState, FormData>(
    async (prev, formData) => {
      const result = await saveName(prev, formData);
      if (!result.error) {
        // The dialog stays open and celebrates instead of closing.
        // Reduced motion skips the confetti; the message still lands.
        setSavedName(String(formData.get("firstName") ?? "").trim());
        fireConfetti();
      }
      return result;
    },
    { error: null }
  );

  if (savedName !== null) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Congratulations{savedName ? `, ${savedName}` : ""}. You&apos;re
              set up.
            </DialogTitle>
          </DialogHeader>

          <p className="-mt-2 text-[15px] text-slate-600">
            Your first deal is on the board and your name is on the door. If
            the rest of your leads live in a spreadsheet, bring them over.
            Takes about a minute.
          </p>

          <div className="mt-2 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                router.push("/settings/import");
              }}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] text-base font-bold text-white transition-colors hover:bg-[var(--brand-dark)]"
            >
              <FileSpreadsheet className="size-5" />
              Import my leads
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-sm font-medium text-slate-500 hover:underline"
            >
              I&apos;ll add them as I go
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Nice one. What should we call you?
          </DialogTitle>
        </DialogHeader>

        <p className="-mt-2 text-[15px] text-slate-600">
          Your first deal is on the board. This is the last thing we will ask
          you to type about yourself.
        </p>

        <form action={formAction} className="mt-2 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="firstName"
              className="text-sm font-semibold text-slate-700"
            >
              First name
            </label>
            <input
              id="firstName"
              name="firstName"
              defaultValue={defaultFirst}
              autoFocus
              autoComplete="given-name"
              className="h-14 w-full rounded-xl border border-slate-300 px-4 text-xl text-slate-900 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/15"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="lastName"
              className="text-sm font-semibold text-slate-700"
            >
              Last name
            </label>
            <input
              id="lastName"
              name="lastName"
              defaultValue={defaultLast}
              autoComplete="family-name"
              className="h-14 w-full rounded-xl border border-slate-300 px-4 text-xl text-slate-900 outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/15"
            />
          </div>

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="h-12 w-full rounded-xl bg-[var(--brand)] text-base font-bold text-white transition-colors hover:bg-[var(--brand-dark)] disabled:opacity-60"
          >
            {pending ? "Saving..." : "That's me"}
          </button>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-sm font-medium text-slate-500 hover:underline"
          >
            Later
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
