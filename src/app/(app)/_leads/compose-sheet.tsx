"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Copy, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Lead, Template } from "@/db/schema";
import { telDigits } from "@/lib/phone";
import { canDial } from "@/lib/device";
import { logSentMessage } from "./actions";

function fill(text: string, lead: Lead) {
  return text.replaceAll("{{name}}", lead.name.split(" ")[0] || lead.name);
}

/** One text is 160 characters. After that carriers split it. */
const SMS_SEGMENT = 160;

/**
 * Write the message before handing it to the phone or the mail client.
 *
 * Chumley never sends anything. This composes the text and then opens
 * sms: or mailto:, so the message goes out from the user's own number
 * and their own email address, with their own signature attached by
 * their own mail client.
 */
export function ComposeSheet({
  lead,
  templates,
  channel,
  open,
  onOpenChange,
  onSend,
}: {
  lead: Lead;
  templates: Template[];
  channel: "text" | "email";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend?: () => void;
}) {
  const isText = channel === "text";
  const choices = templates.filter((t) =>
    isText ? t.channel === "sms" : t.channel === "email"
  );

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);
  const [canOpenSms, setCanOpenSms] = useState(true);
  const [, startLogging] = useTransition();

  // Reset each time it opens so the last lead's message never leaks over.
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seed the draft when the sheet opens
    setSubject("");
    setBody("");
    setCopied(false);
  }, [open, lead.id, channel]);

  // sms: does nothing on most desktops, so offer copy instead of a dead link.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the platform once on mount
    setCanOpenSms(canDial());
  }, []);

  function apply(template: Template) {
    setBody(fill(template.body, lead));
    if (!isText && template.subject) setSubject(fill(template.subject, lead));
  }

  const dialable = telDigits(lead.phone);
  const href = isText
    ? `sms:${dialable}${body ? `?&body=${encodeURIComponent(body)}` : ""}`
    : `mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const segments = Math.max(1, Math.ceil(body.length / SMS_SEGMENT));

  function record() {
    if (!body.trim()) return;
    startLogging(async () => {
      await logSentMessage(lead.id, channel, body);
    });
  }

  async function copy() {
    await navigator.clipboard.writeText(body);
    setCopied(true);
    record();
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isText ? "Text" : "Email"} {lead.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {choices.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label>Start from a saved message</Label>
              <div className="flex flex-wrap gap-2">
                {choices.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => apply(t)}
                    className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-900 hover:bg-slate-50"
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isText && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="compose-subject">Subject</Label>
              <Input
                id="compose-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Following up"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="compose-body">Message</Label>
            <Textarea
              id="compose-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={isText ? 5 : 8}
              placeholder={
                isText ? "Type your text..." : "Type your email..."
              }
            />
            {isText && (
              <p className="text-xs text-slate-500">
                {body.length} characters
                {segments > 1 ? ` · sends as ${segments} texts` : ""}
              </p>
            )}
            {!isText && (
              <p className="text-xs text-slate-500">
                Your email program adds your signature when it opens.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {isText && !canOpenSms ? (
              <Button onClick={copy} className="flex-1" disabled={!body}>
                {copied ? (
                  <>
                    <Check className="size-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    Copy the message
                  </>
                )}
              </Button>
            ) : (
              <Button
                render={
                  <a
                    href={href}
                    onClick={() => {
                      record();
                      onSend?.();
                      onOpenChange(false);
                    }}
                  />
                }
                nativeButton={false}
                className="flex-1"
              >
                {isText ? (
                  <>
                    <MessageSquare className="size-4" />
                    Open Messages
                  </>
                ) : (
                  <>
                    <Mail className="size-4" />
                    Open email
                  </>
                )}
              </Button>
            )}
          </div>

          {isText && !canOpenSms && (
            <p className="text-xs text-slate-500">
              Texting opens your phone&apos;s messaging app. On a computer,
              copy the message and paste it on your phone.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
