"use client";

import { useState, useTransition } from "react";
import { Mail, MessageSquare, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Lead, Template } from "@/db/schema";
import { telDigits } from "@/lib/phone";
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
  const [, startLog] = useTransition();

  /**
   * Dialling is the log.
   *
   * Text and email have always recorded themselves on send. Calling was the
   * exception: it handed off to the dialer and left the writing-down to a
   * form the rep had to come back to. It no longer does. The href still
   * fires, so the phone rings exactly as before, and the row is written
   * alongside it rather than instead of it.
   */
  const handleCall = () => {
    onContact?.("call");
    startLog(async () => {
      const { activityId, error } = await logCallTouch(lead.id);
      if (error) {
        toast.error(error);
        return;
      }
      if (!activityId) return;

      if (onCallLogged) {
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
    });
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
