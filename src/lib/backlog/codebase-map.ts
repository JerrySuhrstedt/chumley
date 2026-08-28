/**
 * What the scoping model knows about this codebase. It runs on the Claude
 * API with no repository access, so this map is its entire view of the
 * code: a product summary and the source tree, annotated where a file
 * name alone would mislead. Kept honest by hand; if a big area moves,
 * update this or scoping will start pointing at ghosts.
 *
 * Last refreshed against the tree: 08-28-2026.
 */
export const CODEBASE_MAP = `Chumley is a mobile-first CRM for small sales teams (field reps, contractors),
built on Next.js App Router + React 19, Drizzle ORM on Postgres, Tailwind,
better-auth, deployed on Vercel at chumley.app. Its pitch: nothing to set up,
log a call in one tap. Installable as a PWA. The main surface is a kanban
board of leads with swipe/tap interactions, one-tap call/text/email logging
with undo, next-action follow-ups, CSV import, team invites, Paddle billing.

Source tree (repo-relative), key areas annotated:

src/app/(app)/ — the signed-in app shell
  _leads/ — the board and everything on it
    leads-board.tsx, lead-column.tsx, lead-card.tsx, swipeable-card.tsx — board, columns, cards, swipe-to-advance
    lead-detail-dialog.tsx — the card detail view: contact buttons, activity feed, next action
    tap-to-contact.tsx — Call/Text/Email tap handling; instant logging with undo lives here
    call-wrap-up.tsx — outcome picker + note box that appears after a logged call
    compose-sheet.tsx — text/email compose with saved templates; logs on send (logSentMessage)
    activity-logger.tsx, activity-item.tsx, activity-meta.ts — manual activity log form, feed rows, type enum (call/email/text/meeting/note)
    quick-add-lead-dialog.tsx — the Add lead dialog
    lead-edit-form.tsx — full edit form
    next-action-section.tsx — follow-up date presets (Tomorrow / In 3 days / ...)
    board-filters.tsx, scorecard.tsx — filter chips, the money/due-today counters
    stages.ts, stages-context.tsx, add-stage.tsx, delete-stage-dialog.tsx, stage-actions.ts, stage-limits.ts — column (stage) rename/add/reorder
    actions.ts — server actions for lead CRUD and activity logging
    temperature-picker.tsx, temperature.ts, owner-picker.tsx, owners-context.tsx, lead-avatar.tsx, bucket-hint.tsx, bucket-name.tsx, empty-board.tsx, sample-banner.tsx
  _onboarding/ — first-run: checklist.tsx (getting-started list), coach-marks.tsx (the two pop-up tips), name-step.tsx, actions.ts
  _report/ — in-app "report a problem" button + action
  _shell/ — pull-to-refresh.tsx, refresh-on-return.tsx, read-only-banner.tsx, deactivated.tsx
  dashboard/ — page.tsx, next-steps.tsx (due follow-ups), pipeline-funnel.tsx, pipeline-explorer.tsx
  pipeline/ — the board page itself (page.tsx)
  contacts/ — flat searchable contact list, sort-select.tsx, sort.ts
  calendar/ — calendar view of next actions
  settings/ — profile, team (invites, remove-member), templates (saved messages), import (csv-importer.tsx + fields.ts visual mapper), billing (Paddle checkout, seats, cancel), form (embeddable lead form)
  admin/ — the back office (owner only): accounts, users, problem reports, UAT punch-list reports, backlog, promo codes, reviews
  layout.tsx — app shell: sidebar (app-sidebar.tsx), topbar, auth gate
src/app/(marketing)/ — public site: page.tsx (homepage), pricing/, legal pages, _components/ (site-header, board-preview, faq-list, ...)
src/app/uat/ — the hidden tester punch list: page.tsx, uat-client.tsx (checklist UI, localStorage draft), checks.ts (the check definitions), actions.ts (submit + draft save)
src/app/uat/[token]/ — personal tester links with server-saved drafts
src/app/login/ — email + Google + LinkedIn sign-in (better-auth)
src/app/onboarding/ — team naming after signup
src/app/join/[token]/ — team invite acceptance
src/app/f/[token]/ — public embeddable lead form
src/app/api/ — auth routes, health, client-error intake, webhooks (paddle, leads)
src/components/ — global-search.tsx, phone-input.tsx, install-prompt.tsx / install-card.tsx / install-steps.tsx (PWA install), topbar.tsx, app-sidebar.tsx, register-sw.tsx, ui/ (shadcn primitives: dialog, button, input, select, table, ...)
src/lib/ — shared server code
  phone.ts — phone number normalization and dialability (extensions, +44, spaces)
  dial-handoff.ts — detecting whether the Call tap actually opened a dialer (the cancelled-call / no-dialer-app cases)
  stages.ts, today.ts, org.ts, gate.ts / gate-messages.ts (trial + read-only gating), auth.ts, auth-gate.ts (route protection), admin.ts, admin-data.ts, alert.ts (ops email), paddle/ (billing), site-url.ts, backlog/ (this scoping pipeline)
src/db/schema.ts — Drizzle schema: organizations, memberships, leads, activities, stages, templates, subscriptions, problem_reports, uat_reports, uat_testers, backlog_items, reviews, promo codes
src/db/auth-schema.ts — better-auth tables (users, sessions, accounts)
src/proxy.ts — request proxy wiring the auth gate
tests/ — vitest: unit/, dom/, integration/`;
