"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRightCircle, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DeleteButton } from "@/components/delete-button";
import type { Activity, Lead, Template } from "@/db/schema";
import { telDigits } from "@/lib/phone";
import {
  addToPipeline,
  deleteLead,
  removeFromPipeline,
  type ActivityType,
} from "./actions";
import { ActivityItem } from "./activity-item";
import { ActivityLogger } from "./activity-logger";
import { LeadAvatar } from "./lead-avatar";
import { TemperaturePicker } from "./temperature-picker";
import { OwnerPicker } from "./owner-picker";
import { LeadEditForm } from "./lead-edit-form";
import { NextActionSection } from "./next-action-section";
import { CONTACT_STAGE } from "./stages";
import { useStages } from "./stages-context";
import { TapToContact } from "./tap-to-contact";
import { CallWrapUp } from "./call-wrap-up";

type LeadWithActivities = Lead & { activities: Activity[] };

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900">{value || "—"}</dd>
    </div>
  );
}

export function LeadDetailDialog({
  lead,
  templates,
  open,
  onOpenChange,
  initialLogType = "note",
}: {
  lead: LeadWithActivities;
  templates: Template[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-selects the log type when opened straight from a Call/Text/Email tap. */
  initialLogType?: ActivityType;
}) {
  const allStages = useStages();
  const [editing, setEditing] = useState(false);
  const [logType, setLogType] = useState<ActivityType>(initialLogType);
  /** The call just dialled from here, waiting on its outcome. */
  const [wrapUpId, setWrapUpId] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- follow the channel the caller opened with
    setLogType(initialLogType);
  }, [initialLogType]);

  // Reaching out scrolls the log panel into view so the note is the obvious
  // next step once the dialer or mail client hands control back. Calling no
  // longer needs that panel at all, because the row is already written by
  // the time the dialer opens, so it scrolls to the wrap-up instead.
  function handleContact(type: "call" | "text" | "email") {
    if (type === "call") return;
    setLogType(type);
    logRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function handleCallLogged(activityId: string) {
    setWrapUpId(activityId);
    // Deferred a frame so the strip exists before we scroll to it.
    requestAnimationFrame(() =>
      wrapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    );
  }

  const activities = [...lead.activities].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  const stageLabel =
    allStages.find((s) => s.key === lead.stage)?.label ?? "";
  const subtitle = [lead.title, lead.companyName].filter(Boolean).join(" at ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        {/* Header */}
        <DialogHeader className="shrink-0 border-b border-slate-200 px-5 py-4">
          <div className="flex items-start gap-4">
            <LeadAvatar lead={lead} className="size-14 text-lg" />

            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-xl font-semibold text-slate-900">
                {lead.name}
              </DialogTitle>
              {subtitle && (
                <p className="truncate text-sm text-slate-600">{subtitle}</p>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="flex items-center gap-1.5 text-[var(--brand)] hover:underline"
                  >
                    <Mail className="size-3.5" />
                    {lead.email}
                  </a>
                )}
                {lead.phone && (
                  <a
                    href={`tel:${telDigits(lead.phone)}`}
                    className="flex items-center gap-1.5 text-slate-700 hover:underline"
                  >
                    <Phone className="size-3.5" />
                    {lead.phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          {editing ? (
            <div className="p-5">
              <LeadEditForm lead={lead} onSuccess={() => setEditing(false)} />
              <Button
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 p-5 md:grid-cols-[1fr_16rem]">
              {/* Main column */}
              <div className="flex flex-col gap-4">
                <section className="rounded-lg border border-slate-200 bg-white p-4">
                  <h3 className="mb-3 text-sm font-semibold text-slate-900">
                    What&apos;s next
                  </h3>
                  <NextActionSection lead={lead} />
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-4">
                  <h3 className="mb-3 text-sm font-semibold text-slate-900">
                    Reach out
                  </h3>
                  <TapToContact
                    lead={lead}
                    templates={templates}
                    size="default"
                    onContact={handleContact}
                    onCallLogged={handleCallLogged}
                  />

                  {wrapUpId && (
                    <div ref={wrapRef} className="mt-3">
                      <CallWrapUp
                        key={wrapUpId}
                        activityId={wrapUpId}
                        onDone={() => setWrapUpId(null)}
                      />
                    </div>
                  )}
                </section>

                <section
                  ref={logRef}
                  className="rounded-lg border border-slate-200 bg-white p-4"
                >
                  <h3 className="mb-3 text-sm font-semibold text-slate-900">
                    Add what happened
                  </h3>
                  <ActivityLogger leadId={lead.id} initialType={logType} />
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-4">
                  <h3 className="mb-3 text-sm font-semibold text-slate-900">
                    History
                  </h3>
                  <ul className="flex flex-col gap-4">
                    {activities.length === 0 && (
                      <p className="text-sm text-slate-500">
                        No calls, emails, or notes logged yet.
                      </p>
                    )}
                    {activities.map((activity) => (
                      <ActivityItem key={activity.id} activity={activity} />
                    ))}
                  </ul>
                </section>
              </div>

              {/* Right rail */}
              <aside className="flex flex-col gap-4">
                <section className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Contact info
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="text-sm font-medium text-[var(--brand)] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <dl className="flex flex-col gap-3">
                    <InfoRow label="Name" value={lead.name} />
                    <InfoRow label="Job title" value={lead.title} />
                    <InfoRow label="Company" value={lead.companyName} />
                    <InfoRow label="Email" value={lead.email} />
                    <InfoRow label="Phone" value={lead.phone} />
                    <InfoRow
                      label="Value"
                      value={lead.value ? `$${lead.value}` : null}
                    />
                    <InfoRow label="Bucket" value={stageLabel} />
                  </dl>
                </section>

                {/* Above the destructive actions, so a rating people set
                    every day is not sitting under a Delete button. */}
                <OwnerPicker leadId={lead.id} ownerId={lead.ownerId} />
                <TemperaturePicker leadId={lead.id} value={lead.temperature} />

                {lead.stage === CONTACT_STAGE ? (
                  <form
                    action={async () => {
                      await addToPipeline(lead.id);
                      onOpenChange(false);
                    }}
                  >
                    <Button type="submit" className="w-full">
                      <ArrowRightCircle className="size-4" />
                      Add to board
                    </Button>
                  </form>
                ) : (
                  <form
                    action={async () => {
                      await removeFromPipeline(lead.id);
                      onOpenChange(false);
                    }}
                  >
                    <Button type="submit" variant="outline" size="sm">
                      Remove from board
                    </Button>
                  </form>
                )}

                <DeleteButton
                  action={async () => {
                    await deleteLead(lead.id);
                    onOpenChange(false);
                  }}
                  confirmMessage={`Delete ${lead.name}? This can't be undone.`}
                />
              </aside>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
