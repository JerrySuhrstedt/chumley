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
import { isDialable, telDigits } from "@/lib/phone";
import { canDial } from "@/lib/device";
import { observeDial } from "@/lib/dial-handoff";
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
  // Whether this device can place calls at all: a property of the device,
  // answered from the device, never inferred from hand-off timing. Read
  // after mount because the server render has no navigator.
  const [dialCapable, setDialCapable] = useState(false);
  const [, startLog] = useTransition();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the platform once on mount
    setDialCapable(canDial());
  }, []);

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
   * Offer to log a call we cannot vouch for.
   *
   * Covers both "back too fast to have talked" and "nothing took the
   * screen". The rep knows which it was; neither guess is worth writing to
   * a timeline on its own.
   */
  const offerToLog = (why: string) => {
    toast(`No call logged to ${lead.name}`, {
      description: why,
      duration: 20_000,
      action: { label: "I made the call, log it", onClick: logNow },
    });
  };

  /**
   * Dialling is the log, but only a dial that plausibly happened.
   *
   * Nothing is written until the outcome is known. The row used to go in
   * the moment focus left and come out again if the rep returned too
   * quickly, which is fine right up until Android discards the page while
   * it is backgrounded: the delete never runs and a call that was never
   * placed stays on the timeline. Waiting costs a second of latency on a
   * real call and removes the only path that could invent one.
   */
  const handleCall = () => {
    // The anchor render means base-ui's disabled guard runs after this
    // handler, not before it, so the gate has to live here too: without
    // it a lead with no number reaches the tel: hand-off and earns the
    // can't-place-the-call dialog for a call that could never happen.
    if (!canCall) return;
    onContact?.("call");

    watch((done) =>
      observeDial((outcome, awayMs) => {
        done();

        if (outcome === "dialed") {
          startLog(async () => {
            const { activityId, error } = await logCallTouch(lead.id);
            if (error) {
              toast.error(error);
              return;
            }
            if (activityId) announce(activityId);
          });
          return;
        }

        if (outcome === "too-short") {
          offerToLog(
            `You were away ${Math.max(1, Math.round(awayMs / 1000))} seconds, so it looked like it never connected.`
          );
          return;
        }

        // Nothing took the screen. On a phone that is a refused dial
        // prompt; on a desktop it usually means there is no dialer at all.
        if (dialCapable) {
          offerToLog(
            "Nothing here took the call. If you made it anyway, log it."
          );
          return;
        }
        setNoDialer(true);
      })
    );
  };

  const stop = stopPropagation
    ? (e: React.MouseEvent) => e.stopPropagation()
    : undefined;

  // Stricter than "has a phone value": "ext 4412" or a half-typed number
  // must not light up a button that would mis-dial. Text shares the gate
  // because sms: chokes on the same inputs tel: does.
  const canCall = isDialable(lead.phone);
  const dialable = telDigits(lead.phone);
  const telHref = canCall && dialable ? `tel:${dialable}` : "#";

  return (
    <>
      <div className="flex gap-1" onClick={stop}>
        <Button
          render={<a href={telHref} onClick={handleCall} />}
          variant="outline"
          size={size}
          disabled={!canCall}
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
          disabled={!canCall}
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
