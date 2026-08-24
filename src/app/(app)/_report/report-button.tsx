"use client";

import { useActionState, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Check, MessageSquareWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { sendReport, type ReportState } from "./actions";

const INITIAL: ReportState = { error: null, sent: false };

/**
 * What kind of thing this is, asked before the words.
 *
 * "Nice work" is not decoration. A form that only accepts complaints is
 * one most people never open, and sorting the good from the broken at
 * the point of writing costs the sender nothing and saves reading every
 * one to find out which is which.
 */
const KINDS = [
  { value: "broke", label: "Something broke" },
  { value: "confusing", label: "Confusing" },
  { value: "idea", label: "Idea" },
  { value: "praise", label: "Nice work" },
] as const;

const PROMPT: Record<string, string> = {
  broke: "What were you trying to do, and what happened instead?",
  confusing: "What did you expect to happen, and what did you see?",
  idea: "What would you like it to do?",
  praise: "What worked well?",
};

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
  const [kind, setKind] = useState<string>("broke");
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
                  Every one of these gets read.
                </p>
              </div>
            </div>
          ) : (
            <form action={action}>
              <DialogHeader>
                <DialogTitle>What happened?</DialogTitle>
              </DialogHeader>

              <input type="hidden" name="path" value={pathname} />
              <input type="hidden" name="kind" value={kind} />

              <div className="mt-3 flex flex-wrap gap-2">
                {KINDS.map((k) => {
                  const active = kind === k.value;
                  return (
                    <button
                      key={k.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setKind(k.value)}
                      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-[var(--brand)]/30 focus-visible:outline-none ${
                        active
                          ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {k.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3">
                <Textarea
                  name="message"
                  required
                  autoFocus
                  rows={5}
                  maxLength={4000}
                  // Changes with the chip, because "what happened instead"
                  // is the wrong question to ask somebody who picked
                  // "Nice work".
                  placeholder={PROMPT[kind]}
                />
              </div>

              <p className="mt-2 text-xs text-slate-500">
                We automatically include the page you are on, so you do not
                have to describe where you were.
              </p>

              {state.error && (
                <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {state.error}
                </p>
              )}

              {/* Deliberately not DialogFooter. That component turns
                  itself into a row at the sm breakpoint, which put the
                  path beside the button and pushed it outside the
                  dialog. One button and a caption is a stack at every
                  width. */}
              <div className="mt-5 flex flex-col gap-1.5">
                <Button type="submit" loading={pending} className="w-full">
                  Send
                </Button>
                <p className="text-center font-mono text-[11px] text-slate-400">
                  {pathname}
                </p>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
