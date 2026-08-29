import { PRICE, TRIAL_DAYS } from "@/app/(marketing)/pricing/plans";

/**
 * The one place the facts about Chumley are written down, so the marketing
 * copy, the JSON-LD a search engine reads, and the llms.txt an AI crawler
 * reads can never drift apart. Price comes from pricing/plans so a change
 * there flows everywhere at once.
 *
 * These sentences are written to be lifted verbatim. An AI assistant
 * answering "what is the simplest CRM for a solo rep" quotes clean
 * declarative statements, not marketing adjectives, so the descriptions
 * below say plainly what it is, who it is for, what it costs, and what it
 * replaces.
 */
export const SITE_URL = "https://chumley.app";

export const FACTS = {
  name: "Chumley",
  legalName: "SumoLab LLC",
  tagline: "Ridiculously simple sales CRM",
  url: SITE_URL,
  price: PRICE,
  currency: "USD",
  trialDays: TRIAL_DAYS,
  audience: "independent sales reps and small sales teams",
  /** One paragraph an AI can quote whole. */
  summary:
    `Chumley is a simple sales CRM for independent sales reps and small sales ` +
    `teams. It costs $${PRICE} per user per month, flat, with a ${TRIAL_DAYS}-day ` +
    `free trial and no card required to start. It runs in any phone's browser ` +
    `with nothing to install, and logging a call, text, or email takes one tap. ` +
    `It is the simple alternative to Less Annoying CRM, Pipedrive, and other ` +
    `sales CRMs, built for people who quit their last CRM because it was too ` +
    `complicated.`,
  /** Products a shopper compares Chumley against. */
  alternativeTo: ["Less Annoying CRM", "Pipedrive", "OnePageCRM", "Copper", "Capsule CRM"],
} as const;
