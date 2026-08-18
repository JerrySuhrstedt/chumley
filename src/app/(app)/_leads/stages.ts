import type { LeadStage } from "./actions";

/** The board. A contact is not here until it shows interest. */
export const STAGES: { value: LeadStage; label: string }[] = [
  { value: "new_lead", label: "New Lead" },
  { value: "contacted", label: "Contacted" },
  { value: "proposal_sent", label: "Proposal Sent" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export const CONTACT_STAGE: LeadStage = "contact";

/** Includes the off-pipeline state, for labelling records anywhere. */
export const ALL_STAGES: { value: LeadStage; label: string }[] = [
  { value: CONTACT_STAGE, label: "Contact" },
  ...STAGES,
];

export function stageLabel(stage: LeadStage) {
  return ALL_STAGES.find((s) => s.value === stage)?.label ?? stage;
}

export function isInPipeline(stage: LeadStage) {
  return stage !== CONTACT_STAGE;
}

export function nextStage(stage: LeadStage): LeadStage | null {
  const order: LeadStage[] = [
    "new_lead",
    "contacted",
    "proposal_sent",
    "won",
  ];
  const index = order.indexOf(stage);
  if (index === -1 || index === order.length - 1) return null;
  return order[index + 1];
}

export type NextActionStatus = {
  key: "overdue" | "today" | "upcoming" | "none";
  label: string;
  color: string;
};

/**
 * At-a-glance urgency of a lead's next step, shown as a Trello-style colored
 * label on the card. "none" is the nudge to set one.
 */
export function nextActionStatus(lead: {
  nextActionText: string | null;
  nextActionDue: string | null;
}): NextActionStatus {
  if (!lead.nextActionText) {
    return {
      key: "none",
      label: "No next step",
      color: "var(--label-none)",
    };
  }

  if (!lead.nextActionDue) {
    return {
      key: "upcoming",
      label: lead.nextActionText,
      color: "var(--label-upcoming)",
    };
  }

  const today = new Date().toISOString().slice(0, 10);

  if (lead.nextActionDue < today) {
    return {
      key: "overdue",
      label: lead.nextActionText,
      color: "var(--label-overdue)",
    };
  }

  if (lead.nextActionDue === today) {
    return {
      key: "today",
      label: lead.nextActionText,
      color: "var(--label-today)",
    };
  }

  return {
    key: "upcoming",
    label: lead.nextActionText,
    color: "var(--label-upcoming)",
  };
}
