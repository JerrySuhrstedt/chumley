"use client";

import { useState } from "react";
import { Mail, MessageSquare, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Lead, Template } from "@/db/schema";
import { telDigits } from "@/lib/phone";
import { ComposeSheet } from "./compose-sheet";

export function TapToContact({
  lead,
  templates,
  size = "icon",
  stopPropagation = false,
  onContact,
}: {
  lead: Lead;
  templates?: Template[];
  size?: "icon" | "default";
  stopPropagation?: boolean;
  /** Fired alongside the hand-off so the caller can open the log. */
  onContact?: (type: "call" | "text" | "email") => void;
}) {
  // Text and email open a compose step first, so the sender picks a saved
  // message and edits it. Calling has nothing to write, so it dials.
  const [composing, setComposing] = useState<"text" | "email" | null>(null);

  const stop = stopPropagation
    ? (e: React.MouseEvent) => e.stopPropagation()
    : undefined;

  const dialable = telDigits(lead.phone);
  const telHref = dialable ? `tel:${dialable}` : "#";

  return (
    <>
      <div className="flex gap-1" onClick={stop}>
        <Button
          render={<a href={telHref} onClick={() => onContact?.("call")} />}
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
