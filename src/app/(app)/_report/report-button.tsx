"use client";

import { useActionState, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Check, MessageSquareWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { sendReport, type ReportState } from "./actions";

const INITIAL: ReportState = { error: null, sent: false };

/**
 * "Report a problem", on every screen.
 *
 * Parked bottom right rather than buried in settings, because the moment
 * worth capturing is the moment it breaks, and anybody who has to go
 * looking for the form has already decided not to bother.
 *
 * It asks one question. Which page and which browser are attached
 * automatically, so a non-technical rep is never asked to describe their
 * setup, which is the point at which most people give up.
 */
export function ReportButton({
  variant = "sidebar",
  collapsed = false,
}: {
  /** Where it is being rendered, which decides how it looks. */
  variant?: "sidebar" | "row";
  /** Sidebar only, when the rail is narrow. */
  collapsed?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(sendReport, INITIAL);
  const pathname = usePathname();

  useEffect(() => {
    if (!state.sent) return;
    // Long enough to read the thank you, short enough not to be in the way.
    const t = setTimeout(() => setOpen(false), 2200);
    return () => clearTimeout(t);
  }, [state.sent]);

  return (
    <>
      {variant === "sidebar" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Report a problem"
          className={`flex items-center gap-3 rounded-md py-2 text-sm text-[var(--nav-ink)] transition-colors hover:bg-[var(--nav-hover)] hover:text-white focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none ${
            collapsed ? "justify-center px-0" : "px-3"
          }`}
        >
          <MessageSquareWarning className="size-5 shrink-0" />
          {!collapsed && <span>Report a problem</span>}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-slate-50 focus-visible:ring-3 focus-visible:ring-slate-300 focus-visible:outline-none"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <MessageSquareWarning className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium text-slate-900">
              Report a problem
            </span>
            <span className="block text-sm text-slate-500">
              Something broken or confusing? Tell us and it gets read.
            </span>
          </span>
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          {state.sent ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <span className="flex size-11 items-center justify-center rounded-full bg-emerald-100">
                <Check className="size-6 text-emerald-700" strokeWidth={3} />
              </span>
              <div>
                <p className="font-semibold text-slate-900">Got it, thank you</p>
                <p className="mt-1 text-sm text-slate-600">
                  Jerry reads every one of these.
                </p>
              </div>
            </div>
          ) : (
            <form action={action}>
              <DialogHeader>
                <DialogTitle>Report a problem</DialogTitle>
                <DialogDescription>
                  What went wrong? Plain words are fine. We already know
                  which page you are on and what you are using, so there is
                  no need to explain any of that.
                </DialogDescription>
              </DialogHeader>

              <input type="hidden" name="path" value={pathname} />

              <div className="mt-4">
                <Textarea
                  name="message"
                  required
                  autoFocus
                  rows={5}
                  maxLength={4000}
                  placeholder="The card would not drag to Won and nothing happened when I tapped it."
                />
              </div>

              {state.error && (
                <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {state.error}
                </p>
              )}

              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                >
                  Never mind
                </Button>
                <Button type="submit" loading={pending}>
                  Send it
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
