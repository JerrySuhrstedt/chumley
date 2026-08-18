import { leadStageEnum } from "@/db/schema";

type LeadStage = (typeof leadStageEnum.enumValues)[number];

export type FieldKey =
  | "name"
  | "firstName"
  | "lastName"
  | "companyName"
  | "email"
  | "phone"
  | "title"
  | "value"
  | "stage"
  | "nextActionText"
  | "nextActionDue";

export const IMPORT_FIELDS: {
  key: FieldKey;
  label: string;
  hint?: string;
  /** Header fragments seen in exports from other CRMs and spreadsheets. */
  aliases: string[];
}[] = [
  {
    key: "name",
    label: "Full name",
    hint: "Or map First and Last name separately",
    aliases: ["full name", "name", "contact", "contact name", "lead name"],
  },
  { key: "firstName", label: "First name", aliases: ["first name", "first", "fname", "given name"] },
  { key: "lastName", label: "Last name", aliases: ["last name", "last", "lname", "surname", "family name"] },
  {
    key: "companyName",
    label: "Company",
    aliases: ["company", "company name", "organization", "organisation", "account", "business", "employer"],
  },
  {
    key: "email",
    label: "Email",
    aliases: ["email", "e-mail", "email address", "work email", "primary email"],
  },
  {
    key: "phone",
    label: "Phone",
    aliases: ["phone", "telephone", "phone number", "mobile", "cell", "work phone", "primary phone"],
  },
  { key: "title", label: "Job title", aliases: ["title", "job title", "position", "role"] },
  {
    key: "value",
    label: "Deal value",
    aliases: ["value", "amount", "deal value", "deal size", "revenue", "price", "estimate"],
  },
  { key: "stage", label: "Stage", aliases: ["stage", "status", "pipeline stage", "deal stage"] },
  {
    key: "nextActionText",
    label: "Next step",
    aliases: ["next step", "next action", "task", "follow up", "follow-up"],
  },
  {
    key: "nextActionDue",
    label: "Next step due",
    aliases: ["due", "due date", "next step due", "follow up date", "next action date"],
  },
];

const norm = (value: string) =>
  value.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

/** Best-guess mapping of CSV headers to lead fields. */
export function autoMap(headers: string[]): Record<string, FieldKey | ""> {
  const mapping: Record<string, FieldKey | ""> = {};
  const taken = new Set<FieldKey>();

  for (const header of headers) {
    const h = norm(header);
    // Aliases are normalized too, so "E-mail" matches the "e-mail" alias.
    const match = IMPORT_FIELDS.find(
      (field) => !taken.has(field.key) && field.aliases.map(norm).includes(h)
    );
    if (match) {
      mapping[header] = match.key;
      taken.add(match.key);
    } else {
      mapping[header] = "";
    }
  }

  return mapping;
}

const STAGE_ALIASES: Record<string, LeadStage> = {
  // Keys are normalized form (lowercase, hyphens/underscores as spaces).
  "new lead": "new_lead",
  new: "new_lead",
  lead: "new_lead",
  prospect: "new_lead",
  open: "new_lead",
  contacted: "contacted",
  working: "contacted",
  "in progress": "contacted",
  qualified: "contacted",
  "proposal sent": "proposal_sent",
  proposal: "proposal_sent",
  quoted: "proposal_sent",
  quote: "proposal_sent",
  estimate: "proposal_sent",
  won: "won",
  "closed won": "won",
  closed: "won",
  sold: "won",
  lost: "lost",
  "closed lost": "lost",
  dead: "lost",
};

/** Unrecognized stages fall back to New Lead rather than dropping the row. */
export function parseStage(raw: string | undefined): LeadStage {
  if (!raw) return "new_lead";
  return STAGE_ALIASES[norm(raw)] ?? "new_lead";
}

/** Strips currency symbols and thousands separators. */
export function parseValue(raw: string | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^0-9.-]/g, "");
  if (!cleaned || Number.isNaN(Number(cleaned))) return null;
  return String(Number(cleaned));
}

/** Accepts ISO and common US formats; anything unparseable becomes null. */
export function parseDate(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;

  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toISOString().slice(0, 10);
}

export function textOrNull(raw: string | undefined): string | null {
  const trimmed = raw?.trim();
  return trimmed ? trimmed : null;
}
