# Chumley product backlog

Started 08-25-2026. One file, ordered by sprint. Items move up or out; nothing gets
deleted, because a rejected idea and its reason is worth more than a clean list.

**Status key:** `DONE` shipped · `PARTIAL` exists but does not meet the bar ·
`TODO` not started · `QUESTIONED` proposed, but the premise is worth arguing with.

**Size:** S = under a day · M = one to three days · L = a week or more.

---

## Audit: what the "outcompete spreadsheets" list asks for vs what exists

Twelve items were proposed. Four already ship, five are half-built, three are absent.

| # | Item | Status | Where it lives now |
|---|---|---|---|
| 1 | Floating action button for logging | `TODO` | Nothing floating anywhere in the app |
| 2 | Pre-set buttons: phone, email, text, in-person | `DONE` | `activity-meta.ts`, enum has call/email/text/meeting/note |
| 3 | Auto-timestamp on tapping an interaction | `PARTIAL` | Timestamps are automatic, but tapping Call does not log |
| 4 | One-sentence wrap-up field | `DONE` | `activity-logger.tsx`, optional textarea |
| 5 | Single-screen contact view | `DONE` | `/contacts` plus the detail dialog. No nested tabs |
| 6 | Inline editing, spreadsheet-style | `QUESTIONED` | Editing goes through `lead-edit-form.tsx` |
| 7 | Global search and filter | `DONE` | `global-search.tsx`, `searchLeads`, `board-filters.tsx` |
| 8 | Bulk import visual mapper | `DONE` | `settings/import`, `csv-importer.tsx` + `fields.ts` |
| 9 | Note prompt straight after an interaction | `PARTIAL` | Scrolls the logger into view, does not open it |
| 10 | Two-tap follow-up with date presets | `PARTIAL` | `setNextAction` exists behind a raw `<input type="date">` |
| 11 | Push reminders | `TODO` | No Notification API, no subscriptions, no scheduler |
| 12 | "Next action" column on the dashboard | `PARTIAL` | On the card and in the scorecard, not as a column |

### The finding that matters most

The brief's own bar is *"if logging a call takes more than two clicks, they go back to
the spreadsheet."* Chumley currently takes **three**, and the third is the one that
loses people.

Tapping **Call** in the detail dialog runs `handleContact`, which pre-selects the
activity type and smooth-scrolls the log panel into view. Then the dialer opens. The rep
finishes the call, comes back, and the interaction is still not logged: the form is
waiting for them to press Save.

So the app already knows who was called, what kind of interaction it was, and when. It
just declines to write it down without permission. That is the gap, and closing it is
the cheapest item on this list.

---

## Sprint 1 — Logging costs one tap

The stated core problem. Everything here is small and compounds.

**Built 08-25-2026, awaiting UAT.** One correction to the audit above came out of
building it: **text and email already logged themselves** on send, through
`logSentMessage` in the compose sheet. Only Call did not. So the fix was narrower
and sharper than "make logging one tap": it was "make calling behave like the other
two already do".

### S1-1 · Log the interaction on tap `IN UAT` · S
Tapping Call, Text or Email writes the activity immediately with its timestamp, rather
than pre-filling a form. The row appears in the feed with an **Undo** for a few seconds,
which is the honest answer to "what if they misdialled" and is cheaper than a confirm
step. Turns three taps into one.

*Risk:* a rep browsing a lead and tapping a number to read it now creates a log line.
Undo covers it; if it grates in practice, gate on the dialer actually opening.

### S1-2 · The wrap-up appears without being asked for `IN UAT` · S
Once S1-1 lands, the note box opens by itself against the row just written, one line,
focused, dismissible by tapping away. Typing into it updates that activity rather than
creating a second one. Falls almost entirely out of S1-1.

### S1-3 · Follow-up presets `IN UAT` · S
Replace the bare date input with **Tomorrow · In 3 days · Next week · In 2 weeks**, and
keep the date picker behind a "pick a date" link for the rest. `setNextAction` already
takes a date, so this is presentation only.

---

## Sprint 2 — The next step is never out of sight

### S2-1 · A "next action" view `PARTIAL → DONE` · M
The data exists on every lead and shows on the card. What is missing is one screen that
answers "what am I supposed to do today", sorted by due date, overdue first, with the
interaction buttons inline so it can be worked straight down the list.

Arguably this, not the board, is the screen a rep opens first thing. Worth watching once
it exists.

### S2-2 · Floating action button `TODO` · S–M
Persistent, thumb-reachable, opens log-against-a-lead from anywhere. Needs a lead picker
that defaults to recent contacts, which is most of the work.

*Sequencing:* deliberately after S1-1 and S2-1. A FAB that opens the current
three-tap flow just puts a shortcut in front of the wrong thing.

---

## Sprint 3 — Reminders that arrive

### S3-1 · Push notifications for due follow-ups `TODO` · L
Needs VAPID keys, a subscriptions table, a permission flow, and a scheduled job that
reads `next_action_due` and fires.

**Read this before committing to it.** On iPhone, web push only works if the user has
added the app to their home screen. Safari does not deliver push to a site open in a
tab. Chumley is already installable and has an install prompt, but any rep who has not
installed it gets nothing, silently, and has no way to know. For a product aimed at
field reps who mostly live on iPhones, that is a real hole in the middle of the feature.

Cheaper alternatives worth pricing first: a daily digest email of what is due, which
works everywhere and needs no permission; or an in-app badge, which is free.

---

## Questioned, not scheduled

### Q-1 · Inline spreadsheet-style editing `QUESTIONED` · M
The argument for it: spreadsheets win because everything is on one flat screen and
editable in place.

The argument against it, which I think is stronger: Chumley's whole pitch is *nothing to
set up, nothing to learn*, and its differentiator is the board and the swipe. Building a
spreadsheet grid is building the thing being competed with, and inviting the comparison
on the competitor's terms. It also carries real cost that a demo hides: optimistic
updates, conflict handling when two reps edit at once, and mobile keyboards fighting a
grid layout.

Not refused, just not yet. Revisit if a real user asks for it in those words.

### Q-2 · "In-person" as its own button `QUESTIONED` · S
The enum already carries `meeting`, which covers it. This may be a labelling question
rather than a feature. Rename if reps say "in person" and not "meeting".

---

## Already done, verify rather than build

Items 2, 4, 5, 7 and 8 ship today. Before any of them gets rebuilt, open the app and
confirm the existing version actually clears the bar. The import mapper in particular
claims "under 60 seconds" in the brief and has never been timed.

---

## Not from this list, but competing for the same sprints

- **Trial expiry is invisible in the back office.** Teams show `FREE` with no days
  remaining, so a team going read-only is a surprise. Small.
- **The launch video still says Sell1.** VO, wordmark and both end cards. Blocks the
  spot running at all. See the handover in Dropbox.
- **The quick-add dialog renders "New lead in New Lead".** One line in
  `quick-add-lead-dialog.tsx`. Trivial, and visible on the first screen a new user sees.
- **The "ten seconds to add a lead" claim has never been timed.** It is on the homepage.
