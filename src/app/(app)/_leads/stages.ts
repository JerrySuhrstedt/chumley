import type { LeadStage } from "./actions";
import type { Stage } from "@/db/schema";

/** What the board hands around. The database row, unchanged. */
export type BoardStage = Stage;

export const CONTACT_STAGE: LeadStage = "contact";

/** Fallback names for the seeded keys, used where no list is to hand. */
const SEEDED_LABELS: Record<string, string> = {
  contact: "Contact",
  new_lead: "New Lead",
  contacted: "Contacted",
  proposal_sent: "Proposal Sent",
  won: "Won",
  lost: "Lost",
};

export function stageLabel(stage: LeadStage, stages?: BoardStage[]) {
  return (
    stages?.find((s) => s.key === stage)?.label ??
    SEEDED_LABELS[stage] ??
    stage
  );
}

/**
 * The bucket to the right, for the swipe-forward gesture.
 *
 * Walks the team's own order rather than a fixed list, and stops at the
 * last working bucket. Swiping never closes a deal by accident: won and
 * lost are a deliberate drag or a menu choice.
 */
export function nextStage(
  stage: LeadStage,
  stages: BoardStage[]
): LeadStage | null {
  const open = stages.filter((s) => s.kind === "open");
  const index = open.findIndex((s) => s.key === stage);
  if (index === -1) return open[0]?.key ?? null;
  return open[index + 1]?.key ?? stages.find((s) => s.kind === "won")?.key ?? null;
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

/**
 * Fallback colours for the seeded buckets. A team's own buckets carry
 * their colour on the row; this covers anywhere a row is not to hand.
 */
export const STAGE_COLOR: Record<string, string> = {
  contact: "#64748b",
  new_lead: "#2a78d6",
  contacted: "#eb6834",
  proposal_sent: "#4a3aa7",
  won: "#1baf7a",
  lost: "#d94436",
};
