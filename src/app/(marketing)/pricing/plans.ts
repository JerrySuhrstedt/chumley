/**
 * One price. That is the entire pricing model.
 *
 * $14 per user per month, whether it is one rep or a whole team. No
 * yearly discount, no volume ladder, no feature tiers: the simplicity is
 * the positioning, in the Less Annoying CRM tradition. Adopted
 * 08-27-2026, replacing a solo price and a three-step team ladder.
 *
 * Negotiated exceptions still exist, but as decisions a human makes in
 * the back office (custom prices, comps), never as a second column here.
 */
export const PRICE = 14;

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
