import type { LeadStage } from "./actions";

export const STAGES: { value: LeadStage; label: string }[] = [
  { value: "new_lead", label: "New Lead" },
  { value: "contacted", label: "Contacted" },
  { value: "proposal_sent", label: "Proposal Sent" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

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
