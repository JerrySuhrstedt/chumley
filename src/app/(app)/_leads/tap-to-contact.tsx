"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Copy, Mail, MessageSquare, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Lead, Template } from "@/db/schema";
import { telDigits } from "@/lib/phone";
import { watchDialHandoff, watchFocusReturn } from "@/lib/dial-handoff";
import { ComposeSheet } from "./compose-sheet";
import { deleteActivity, logCallTouch } from "./actions";

export function TapToContact({
  lead,
  templates,
  size = "icon",
  stopPropagation = false,
  onContact,
  onCallLogged,
}: {
  lead: Lead;
  templates?: Template[];
  size?: "icon" | "default";
  stopPropagation?: boolean;
  /** Fired alongside the hand-off so the caller can open the log. */
  onContact?: (type: "call" | "text" | "email") => void;
  /**
   * Given the row a tap on Call just created, so a caller with room on
   * screen can ask for the outcome inline. Where this is absent, which is
   * the board and the contacts list, a toast carries the undo instead.
   */
  onCallLogged?: (activityId: string) => void;
}) {
  // Text and email open a compose step first, so the sender picks a saved
  // message and edits it. Calling has nothing to write, so it dials.
  const [composing, setComposing] = useState<"text" | "email" | null>(null);
  // The tel: hand-off went nowhere, so the number is shown instead.
  const [noDialer, setNoDialer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, startLog] = useTransition();

  // Every in-flight watcher, so unmount stops them all. Two fast taps on
  // Call are two watchers, and each has to settle its own row; sharing one
  // slot would strand the first row unjudged.
  const cancelWatches = useRef<Set<() => void>>(new Set());
  useEffect(() => {
    const watches = cancelWatches.current;
    return () => watches.forEach((cancel) => cancel());
  }, []);

  const watch = (start: (done: () => void) => () => void) => {
    const cancel = start(() => cancelWatches.current.delete(cancel));
    cancelWatches.current.add(cancel);
  };

  const announce = (activityId: string) => {
    if (onCallLogged) {
      // The wrap-up strip takes over here, and it carries its own undo.
      onCallLogged(activityId);
      return;
    }
    toast.success(`Call to ${lead.name} logged`, {
      description: "Open the lead to add how it went.",
      action: {
        label: "Undo",
        onClick: () => void deleteActivity(activityId),
      },
    });
  };

  /** The rep vouched for this one, so it logs with no second-guessing. */
  const logNow = () => {
    startLog(async () => {
      const { activityId, error } = await logCallTouch(lead.id);
      if (error) {
        toast.error(error);
        return;
      }
      if (activityId) announce(activityId);
    });
  };

  /**
   * A hand-off proves a dialer opened, not that a call connected; cancel
   * and connect look identical from here. The tell is speed: cancel and
   * the rep is back in the browser inside seconds. So the row is written
   * immediately, because a phone that never comes back to the page must
   * still have its call on record, and then the return decides. A fast
   * return unwrites it and offers to log instead, a rep who stayed away
   * long enough to have talked gets it announced as logged.
   */
  const logIfReal = () => {
    startLog(async () => {
      const { activityId, error } = await logCallTouch(lead.id);
      if (error) {
        toast.error(error);
        return;
      }
      if (!activityId) return;

      watch((done) =>
        watchFocusReturn((returned) => {
          done();
          if (!returned) {
            announce(activityId);
            return;
          }
          void deleteActivity(activityId);
          toast(`Didn't log that call to ${lead.name}`, {
            description: "You came right back, so it looked like it never connected.",
            duration: 20_000,
            action: { label: "It connected, log it", onClick: logNow },
          });
        })
      );
    });
  };

  /**
   * Dialling is the log, but only a dial that happened.
   *
   * Text and email have always recorded themselves on send. Calling logs
   * itself on hand-off: the href fires, and once something on the machine
   * visibly takes the call, the row is written. On a machine with no tel:
   * handler the click is pure silence, and writing a row there records a
   * call that was never placed, so silence gets the number on screen and
   * an explicit "log it" instead.
   */
  const handleCall = () => {
    onContact?.("call");
    watch((done) =>
      watchDialHandoff((taken) => {
        done();
        if (taken) logIfReal();
        else setNoDialer(true);
      })
    );
  };

  const stop = stopPropagation
    ? (e: React.MouseEvent) => e.stopPropagation()
    : undefined;

  const dialable = telDigits(lead.phone);
  const telHref = dialable ? `tel:${dialable}` : "#";

  return (
    <>
      <div className="flex gap-1" onClick={stop}>
        <Button
          render={<a href={telHref} onClick={handleCall} />}
          variant="outline"
          size={size}
          disabled={!lead.phone}
          nativeButton={false}
          className={size === "default" ? "flex-1" : undefined}
        >
          <Phone className="size-4" />
          {size === "default" && "Call"}
        </Button>

        <Button
          onClick={() => setComposing("text")}
          variant="outline"
          size={size}
          disabled={!lead.phone}
          className={size === "default" ? "flex-1" : undefined}
        >
          <MessageSquare className="size-4" />
          {size === "default" && "Text"}
        </Button>

        <Button
          onClick={() => setComposing("email")}
          variant="outline"
          size={size}
          disabled={!lead.email}
          className={size === "default" ? "flex-1" : undefined}
        >
          <Mail className="size-4" />
          {size === "default" && "Email"}
        </Button>
      </div>

      {noDialer && (
        <Dialog
          open
          onOpenChange={(next) => {
            if (!next) {
              setNoDialer(false);
              setCopied(false);
            }
          }}
        >
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>This computer can&apos;t place the call</DialogTitle>
              <DialogDescription>
                Nothing here answered the dial, so the call has not been
                logged. Call from your phone, then log it below.
              </DialogDescription>
            </DialogHeader>

            <p className="text-center text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
              {lead.phone}
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(lead.phone ?? "");
                    setCopied(true);
                  } catch {
                    toast.error("Couldn't copy. Select the number instead.");
                  }
                }}
              >
                {copied ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
                {copied ? "Copied" : "Copy number"}
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setNoDialer(false);
                  setCopied(false);
                  logNow();
                }}
              >
                I made the call, log it
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {composing && (
        <ComposeSheet
          lead={lead}
          templates={templates ?? []}
          channel={composing}
          open
          onOpenChange={(next) => !next && setComposing(null)}
          onSend={() => onContact?.(composing)}
        />
      )}
    </>
  );
}
