"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, PartyPopper, X } from "lucide-react";
import { toast } from "sonner";
import type { OnboardingState } from "@/lib/onboarding";
import { usePathname, useRouter } from "next/navigation";
import { NameStep } from "./name-step";
import { REPLAY_EVENT, REPLAY_KEY } from "./coach-marks";
import {
  CHECKLIST_HIDDEN_KEY as HIDDEN,
  OPEN_ADD_LEAD_EVENT,
  OPEN_ADD_LEAD_KEY,
  REOPEN_CHECKLIST_EVENT,
} from "./events";

const NAME_ASKED = "chumley:name-asked";

/**
 * What an unfinished step does when pressed. A row that names an action
 * and does nothing on tap reads as broken, so every step either starts
 * its action or points straight at it. The two drag/tap steps get told,
 * not toured: the coach-mark machinery cannot target them reliably on
 * every viewport, and a sentence that appears instantly beats a spotlight
 * that silently fails to.
 */
const STEP_NUDGE: Record<string, string> = {
  move: "Drag any card to another bucket. On a phone, press and hold it for a beat first, or just swipe it right.",
  contact:
    "Open a deal and tap Call, Text, or Email. It logs itself when you do.",
};

/**
 * A persistent checklist rather than a tour.
 *
 * This is the one place the research was unambiguous. Mural replaced its
 * pop-ups and banners with a six-step checklist and one-week retention went
 * up 10% relative; Todoist drops a pre-filled list into the empty state and
 * runs no guided tour at all. The reason is that a coach mark is a single
 * moment: dismiss it, or arrive the next morning, and the help is gone. A
 * checklist survives leaving the page, which is where real people do most
 * of their learning.
 *
 * Progress is earned, never claimed. Every tick is computed from work the
 * user actually did.
 */
export function OnboardingChecklist({
  state,
  firstName,
  lastName,
}: {
  state: OnboardingState;
  firstName: string;
  lastName: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [naming, setNaming] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the dismissal on mount
    setHidden(localStorage.getItem(HIDDEN) === "1");
  }, []);

  // The sidebar's "Getting started" entry brings a dismissed checklist
  // back. Dismissal used to be forever, which punished a tidy-up click.
  useEffect(() => {
    const reopen = () => {
      localStorage.removeItem(HIDDEN);
      setHidden(false);
      setOpen(true);
    };
    window.addEventListener(REOPEN_CHECKLIST_EVENT, reopen);
    return () => window.removeEventListener(REOPEN_CHECKLIST_EVENT, reopen);
  }, []);

  /**
   * Start a step's action from its row. "Add a deal" opens the real
   * dialog, through the same window-event channel the tour replay uses,
   * because the dialog lives under the page subtree and this widget does
   * not. Off the pipeline, the note in sessionStorage survives the
   * navigation and the dialog opens on arrival.
   */
  const startStep = (key: string) => {
    if (key === "name") {
      setNaming(true);
      return;
    }
    setOpen(false);
    const nudge = STEP_NUDGE[key];
    const go = pathname !== "/pipeline";
    if (key === "deal") {
      if (go) {
        sessionStorage.setItem(OPEN_ADD_LEAD_KEY, "1");
        router.push("/pipeline");
      } else {
        window.dispatchEvent(new Event(OPEN_ADD_LEAD_EVENT));
      }
      return;
    }
    if (nudge) {
      if (go) router.push("/pipeline");
      toast(nudge, { duration: 8000 });
    }
  };

  const nameStep = state.steps.find((s) => s.key === "name");
  const dealDone = state.steps.find((s) => s.key === "deal")?.done ?? false;

  // The moment the first real deal lands, and only then, ask who they are.
  // Reciprocity in the plainest form: the product did something first.
  useEffect(() => {
    if (hidden || state.complete) return;
    if (!dealDone || nameStep?.done) return;
    if (localStorage.getItem(NAME_ASKED) === "1") return;
    localStorage.setItem(NAME_ASKED, "1");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fire once the first deal exists
    setNaming(true);
  }, [dealDone, nameStep?.done, hidden, state.complete]);

  if (hidden || state.complete) return null;

  const pct = Math.round((state.done / state.total) * 100);

  return (
    <>
      <div className="fixed right-4 bottom-4 z-40 w-[min(20rem,calc(100vw-2rem))]">
        {open && (
          <div className="mb-2 overflow-hidden rounded-2xl bg-white shadow-[0_20px_44px_-14px_rgba(9,30,66,0.5)]">
            <div className="flex items-start justify-between gap-2 px-4 pt-4">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Getting started
                </p>
                <p className="text-xs text-slate-500">
                  {state.done} of {state.total} done
                </p>
              </div>
              <button
                type="button"
                aria-label="Hide this"
                onClick={() => {
                  localStorage.setItem(HIDDEN, "1");
                  setHidden(true);
                }}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mx-4 mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[var(--brand)] transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>

            <ul className="mt-3 flex flex-col pb-2">
              {state.steps.map((step) => {
                // Every unfinished step starts its action except the
                // account step, which can only ever arrive already done.
                const clickable = step.key !== "account" && !step.done;
                return (
                  <li key={step.key}>
                    <button
                      type="button"
                      disabled={!clickable}
                      onClick={() => clickable && startStep(step.key)}
                      className={`flex w-full items-start gap-3 px-4 py-2.5 text-left ${
                        clickable ? "hover:bg-slate-50" : "cursor-default"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${
                          step.done
                            ? "bg-[var(--label-upcoming)]"
                            : "border-2 border-slate-300"
                        }`}
                      >
                        {step.done && (
                          <Check
                            className="size-3 text-white"
                            strokeWidth={3.5}
                          />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span
                          className={`block text-sm font-medium ${
                            step.done
                              ? "text-slate-400 line-through"
                              : "text-slate-900"
                          }`}
                        >
                          {step.label}
                        </span>
                        {!step.done && (
                          <span className="mt-0.5 block text-xs text-slate-500">
                            {step.hint}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                if (pathname === "/pipeline") {
                  window.dispatchEvent(new Event(REPLAY_EVENT));
                } else {
                  sessionStorage.setItem(REPLAY_KEY, "1");
                  router.push("/pipeline");
                }
              }}
              className="w-full border-t border-slate-100 px-4 py-2.5 text-left text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            >
              Show me around again
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-3 rounded-full bg-[var(--deep)] py-3 pr-4 pl-3 text-white shadow-[0_10px_26px_-8px_rgba(0,0,0,0.55)] transition-transform active:scale-95"
        >
          {/* A ring reads as progress faster than any number can. */}
          <span
            className="relative flex size-8 shrink-0 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(var(--brand) ${pct}%, rgba(255,255,255,0.18) ${pct}%)`,
            }}
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-[var(--deep)] text-[11px] font-bold">
              {state.done}
            </span>
          </span>

          <span className="flex-1 text-left text-sm font-semibold">
            Getting started
          </span>
          <span className="text-xs text-white/60">
            {state.done}/{state.total}
          </span>
          <ChevronDown
            className={`size-4 shrink-0 text-white/60 transition-transform ${
              open ? "" : "rotate-180"
            }`}
          />
        </button>
      </div>

      <NameStep
        open={naming}
        onOpenChange={setNaming}
        defaultFirst={firstName}
        defaultLast={lastName}
      />
    </>
  );
}

/** Shown once, the first time every step is ticked. */
export function OnboardingDone() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <PartyPopper className="size-4" />
      That is the whole app.
    </span>
  );
}
