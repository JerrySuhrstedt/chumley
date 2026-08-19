/**
 * One person, or a team. That is the only choice.
 *
 * The team column has volume breaks, not feature tiers. Everybody gets the
 * entire product at every level, so nothing is ever withheld to sell an
 * upgrade later; the price simply falls as more people use it, the way
 * buying more of anything does. A chart of locked features is a decision.
 * A chart of quantities is arithmetic, and the stepper does that for you.
 *
 * The minimum of three is what stops one rep taking the cheaper column.
 */
export type Tier = {
  min: number;
  /** Null means no upper bound. */
  max: number | null;
  monthly: number;
  /** Per person, per year. Ten months for twelve. */
  yearly: number;
};

export const SOLO = {
  name: "Just me",
  who: "One person working their own deals.",
  monthly: 19,
  yearly: 190,
} as const;

export const TEAM_NAME = "Sales team";
export const TEAM_WHO = "A manager and their reps on one board.";
export const TEAM_MIN = 3;

export const TEAM_TIERS: Tier[] = [
  { min: 3, max: 4, monthly: 15, yearly: 150 },
  { min: 5, max: 9, monthly: 13, yearly: 130 },
  { min: 10, max: null, monthly: 11, yearly: 110 },
];

export function tierFor(seats: number): Tier {
  return (
    [...TEAM_TIERS].reverse().find((t) => seats >= t.min) ?? TEAM_TIERS[0]
  );
}

export function tierLabel(t: Tier): string {
  if (t.max === null) return `${t.min} or more`;
  return `${t.min} to ${t.max}`;
}

export const TRIAL_DAYS = 14;

/** Everything, for everyone. There is no upgrade to sell. */
export const INCLUDED = [
  "The pipeline board, drag and drop",
  "Unlimited deals and contacts",
  "Contacts kept separate from live deals",
  "Call, text and email in one tap",
  "Saved messages you can edit",
  "Next steps that turn red when late",
  "Lead temperature and board filters",
  "Import from a spreadsheet",
  "A contact form for your website",
  "Dashboard and funnel",
  "Works on any phone, add it to your home screen",
  "Every future feature, at no extra cost",
];
