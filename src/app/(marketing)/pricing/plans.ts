/**
 * One plan, priced per person. That is the whole model.
 *
 * Tiers are a comparison exercise, and a product whose promise is that
 * there is nothing to work out cannot open with a chart. Per person also
 * solves the thing a flat team price gets wrong: a single rep and a team
 * of twelve are not the same purchase, and charging them the same either
 * overprices the rep or undercharges the team.
 */
export const PRICE = {
  monthly: 19,
  /** Ten months for twelve. */
  yearly: 190,
  trialDays: 14,
} as const;

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
  "Google and LinkedIn sign-in",
  "Invite your whole team",
  "Every future feature, at no extra cost",
];
