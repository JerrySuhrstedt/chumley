import type { MetadataRoute } from "next";

/**
 * Every public URL, in one list.
 *
 * The sitemap, the llms.txt, and the IndexNow ping all read from here, so a
 * new marketing page is added in exactly one place and shows up everywhere a
 * crawler or an AI looks. Anything behind login is deliberately absent.
 */
export type PublicRoute = {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  /** A one-line description, used by llms.txt so an AI knows what each page is. */
  summary: string;
};

export const PUBLIC_ROUTES: PublicRoute[] = [
  { path: "/", priority: 1, changeFrequency: "weekly", summary: "Ridiculously simple sales CRM for independent reps and small teams." },
  { path: "/pricing", priority: 0.9, changeFrequency: "weekly", summary: "One flat price per user, everything included, 14-day free trial." },

  // Comparison and alternative pages (bottom-funnel, product-aware shoppers).
  { path: "/compare/less-annoying-crm", priority: 0.8, changeFrequency: "monthly", summary: "Less Annoying CRM alternative: an honest comparison for small teams." },
  { path: "/compare/pipedrive", priority: 0.8, changeFrequency: "monthly", summary: "A simpler, cheaper Pipedrive alternative for a small sales team." },
  { path: "/compare/onepagecrm", priority: 0.7, changeFrequency: "monthly", summary: "How Chumley compares to OnePageCRM for solo reps and small teams." },

  // Audience and use-case pages.
  { path: "/for/solo-sales-reps", priority: 0.8, changeFrequency: "monthly", summary: "A sales CRM for one person: a team of one, with nothing to administer." },
  { path: "/for/independent-sales-reps", priority: 0.8, changeFrequency: "monthly", summary: "A CRM for 1099 and independent reps: your book stays yours, and several lines share one board." },
  { path: "/for/small-sales-teams", priority: 0.8, changeFrequency: "monthly", summary: "A simple CRM a small, non-technical sales team will actually use." },
  { path: "/for/contractors", priority: 0.7, changeFrequency: "monthly", summary: "A lead and follow-up tracker for contractors who hate CRMs." },

  // Vertical pages.
  { path: "/for/wedding-vendors", priority: 0.6, changeFrequency: "monthly", summary: "The lead tracker wedding vendors actually keep using." },
  { path: "/for/djs", priority: 0.6, changeFrequency: "monthly", summary: "A simple CRM for mobile DJs to track inquiries and bookings." },

  // Guides hub and articles (informational, plain-language searches).
  { path: "/guides", priority: 0.6, changeFrequency: "weekly", summary: "Plain-language guides on tracking sales leads and follow-ups." },
  { path: "/guides/how-to-keep-track-of-sales-leads", priority: 0.7, changeFrequency: "monthly", summary: "How to keep track of sales leads without losing half of them." },
  { path: "/guides/sales-follow-up-app", priority: 0.7, changeFrequency: "monthly", summary: "The simplest way to track sales follow-ups from your phone." },
  { path: "/guides/run-your-sales-day-from-your-phone", priority: 0.6, changeFrequency: "monthly", summary: "How to run your whole sales day from your phone." },
  { path: "/guides/keep-track-of-customers-without-a-spreadsheet", priority: 0.6, changeFrequency: "monthly", summary: "Keeping track of customers without a spreadsheet or a rolodex." },
  { path: "/guides/replace-spreadsheet-with-crm", priority: 0.7, changeFrequency: "monthly", summary: "When a spreadsheet stops working for sales, and what replaces it." },
  { path: "/guides/why-reps-quit-their-crm", priority: 0.6, changeFrequency: "monthly", summary: "Why most reps quit their CRM in the first month." },

  // Legal.
  { path: "/support", priority: 0.7, changeFrequency: "weekly", summary: "Help with Chumley: short guides, and a form that reaches a person the same day." },
  { path: "/support/how-calling-works", priority: 0.6, changeFrequency: "monthly", summary: "Why the Call button works on a phone and often not on a desktop, with a platform matrix." },
  { path: "/support/edit-your-pipeline-columns", priority: 0.6, changeFrequency: "monthly", summary: "Rename, reorder and delete pipeline columns without losing the deals in them." },
  { path: "/support/add-your-first-lead", priority: 0.6, changeFrequency: "monthly", summary: "Add a deal, give it a next step, move it across the board." },
  { path: "/support/import-leads-from-a-spreadsheet", priority: 0.6, changeFrequency: "monthly", summary: "Import an existing list, including the CSV step people miss." },
  { path: "/support/saved-messages-for-text-and-email", priority: 0.6, changeFrequency: "monthly", summary: "Write your follow-up once and send it in two taps, with their first name filled in." },
  { path: "/support/contacts-versus-your-pipeline", priority: 0.6, changeFrequency: "monthly", summary: "Why the board and the contact list are separate, and Remove from board versus Delete." },
  { path: "/support/how-call-logging-works", priority: 0.6, changeFrequency: "monthly", summary: "How Chumley decides a tap on Call became a real phone call, and when it asks instead." },
  { path: "/support/a-tour-of-the-screens", priority: 0.6, changeFrequency: "monthly", summary: "Every part of the dashboard and pipeline board, numbered on the real screens." },
  { path: "/support/invite-your-team", priority: 0.6, changeFrequency: "monthly", summary: "Add people with a link, what they can see, and why that link is a key." },
  { path: "/support/cancel-or-change-your-plan", priority: 0.6, changeFrequency: "monthly", summary: "Cancel in one click, change seats, and what happens to your data afterwards." },
  { path: "/support/lead-notification-emails", priority: 0.6, changeFrequency: "monthly", summary: "The email Chumley sends when a website lead arrives, who gets it, and how to switch it off." },
  { path: "/support/add-the-lead-form-to-your-website", priority: 0.6, changeFrequency: "monthly", summary: "Paste one line of code and website leads land on your board." },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly", summary: "Privacy policy." },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly", summary: "Terms of service." },
  { path: "/refunds", priority: 0.2, changeFrequency: "yearly", summary: "Refund policy." },
];
