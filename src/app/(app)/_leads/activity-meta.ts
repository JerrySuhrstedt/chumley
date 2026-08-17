import {
  CalendarCheck,
  FileInput,
  Mail,
  MessageSquare,
  MoveRight,
  Phone,
  StickyNote,
  type LucideIcon,
} from "lucide-react";
import type { ActivityOutcome, ActivityType } from "./actions";

type TypeMeta = { value: ActivityType; label: string; icon: LucideIcon };

/** Types a rep can log by hand. */
export const ACTIVITY_TYPES: TypeMeta[] = [
  { value: "call", label: "Call", icon: Phone },
  { value: "email", label: "Email", icon: Mail },
  { value: "text", label: "Text", icon: MessageSquare },
  { value: "meeting", label: "Meeting", icon: CalendarCheck },
  { value: "note", label: "Note", icon: StickyNote },
];

/** Recorded by the app; never offered in the logger. */
const SYSTEM_TYPES: TypeMeta[] = [
  { value: "stage_change", label: "Stage change", icon: MoveRight },
  { value: "form_submission", label: "Form submission", icon: FileInput },
];

const ALL_TYPES = [...ACTIVITY_TYPES, ...SYSTEM_TYPES];

type OutcomeMeta = {
  value: ActivityOutcome;
  label: string;
  className: string;
  /** Shown only when the interaction is worth a timeline entry. */
  hint?: string;
};

export const CALL_OUTCOMES: OutcomeMeta[] = [
  {
    value: "connected",
    label: "Connected",
    className: "bg-green-100 text-green-800",
  },
  {
    value: "voicemail",
    label: "Left voicemail",
    className: "bg-amber-100 text-amber-800",
  },
  {
    value: "bad_number",
    label: "Bad number",
    className: "bg-red-100 text-red-700",
  },
  {
    value: "no_answer",
    label: "No answer",
    className: "bg-slate-100 text-slate-700",
    hint: "No message left — usually not worth logging.",
  },
];

export const MEETING_OUTCOMES: OutcomeMeta[] = [
  { value: "held", label: "Held", className: "bg-green-100 text-green-800" },
  {
    value: "rescheduled",
    label: "Rescheduled",
    className: "bg-amber-100 text-amber-800",
  },
  {
    value: "no_show",
    label: "No-show",
    className: "bg-red-100 text-red-700",
  },
];

const ALL_OUTCOMES = [...CALL_OUTCOMES, ...MEETING_OUTCOMES];

export function outcomesFor(type: ActivityType): OutcomeMeta[] {
  if (type === "call") return CALL_OUTCOMES;
  if (type === "meeting") return MEETING_OUTCOMES;
  return [];
}

export function activityMeta(type: ActivityType): TypeMeta {
  return ALL_TYPES.find((t) => t.value === type) ?? ACTIVITY_TYPES[4];
}

export function outcomeMeta(outcome: ActivityOutcome | null) {
  if (!outcome) return null;
  return ALL_OUTCOMES.find((o) => o.value === outcome) ?? null;
}

export function isSystemActivity(type: ActivityType) {
  return SYSTEM_TYPES.some((t) => t.value === type);
}
