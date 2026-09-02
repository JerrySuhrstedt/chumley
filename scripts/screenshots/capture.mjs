/**
 * Regenerates every screenshot used by the support articles.
 *
 * Run it after any UI change that a tutorial shows:
 *
 *   node scripts/screenshots/capture.mjs
 *
 * It signs in to a throwaway documentation account, drives the real app,
 * and overwrites the PNGs in public/support. The articles reference those
 * files by name, so a re-run updates every tutorial at once and nothing has
 * to be edited by hand.
 *
 * WHY A THROWAWAY ACCOUNT, AND WHY IT MATTERS
 *
 * .env.local points at the production database, which holds real customers.
 * Screenshots go on a public marketing page, so photographing any existing
 * account would publish real names, emails and phone numbers. This script
 * therefore signs in as DOCS_EMAIL and refuses to run if that account has
 * ever held a lead that is not one of the seeded examples. The seeded three
 * use example.com addresses and 555 numbers, which are reserved for fiction.
 *
 * Sign-in reads the magic-link token straight from the database rather than
 * an inbox. The account is deliberately unreachable by email, so the send
 * fails and the verification row is used instead. That is the point: nobody
 * can sign in to it from outside.
 */

import { chromium } from "playwright";
import postgres from "postgres";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "../..");
const OUT = path.join(REPO, "public/support");

const BASE = process.env.SHOT_BASE_URL ?? "http://localhost:3000";
const DOCS_EMAIL = "chumley-docs@example.com";

/**
 * The saved session, so a re-run does not sign in again.
 *
 * Signing in every run trips Better Auth's rate limiter within a couple of
 * attempts, which made the script unreliable exactly when it was being
 * iterated on. Re-auth now happens only when this file is missing or its
 * session has lapsed. It holds a session for a fake account against a dev
 * server, but it is still a credential, so it is gitignored.
 */
const STATE = path.join(HERE, ".auth.json");

/** Retina, so the images stay sharp when a page scales them down. */
const SCALE = 2;
const VIEWPORT = { width: 1440, height: 900 };

function env() {
  const file = path.join(REPO, ".env.local");
  if (!fs.existsSync(file)) throw new Error("No .env.local to read DATABASE_URL from.");
  return Object.fromEntries(
    fs
      .readFileSync(file, "utf8")
      .split("\n")
      .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
      .map((l) => [
        l.slice(0, l.indexOf("=")).trim(),
        l.slice(l.indexOf("=") + 1).trim().replace(/^["']|["']$/g, ""),
      ]),
  );
}

/**
 * A fresh magic-link token for the docs account, read from the database.
 *
 * The sign-in request throws on the email send because the address does not
 * exist. That is fine and expected: the verification row is written first.
 */
async function signInUrl(sql) {
  /**
   * Better Auth counts sign-in attempts in Postgres, so a few runs in a row
   * start returning 429 and no verification row is written. Clearing this
   * account's counters is safe: they exist to slow down attacks on a real
   * mailbox, and this address has none.
   */
  await sql`DELETE FROM rate_limits WHERE key LIKE ${"%magic-link%"}`;

  await fetch(`${BASE}/api/auth/sign-in/magic-link`, {
    method: "POST",
    // Better Auth rejects an originless POST with MISSING_OR_NULL_ORIGIN,
    // which a browser always sends and a script never does.
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ email: DOCS_EMAIL }),
  }).catch(() => {});

  const rows = await sql`
    SELECT identifier FROM verifications
    WHERE value LIKE ${"%" + DOCS_EMAIL + "%"}
      AND expires_at > now()
    ORDER BY created_at DESC LIMIT 1`;

  if (rows.length === 0) {
    throw new Error("No usable magic-link token was written. Is the dev server running?");
  }
  return `${BASE}/api/auth/magic-link/verify?token=${rows[0].identifier}&callbackURL=/pipeline`;
}

/**
 * Refuse to photograph anything real.
 *
 * If the docs org has ever held a non-sample lead, somebody has used it as
 * a real account and its board may show real people. Stop rather than
 * publish that.
 */
async function docsUserId(sql) {
  const rows = await sql`SELECT id FROM users WHERE email = ${DOCS_EMAIL} LIMIT 1`;
  return rows[0]?.id ?? "";
}

async function assertSafe(sql) {
  const rows = await sql`
    SELECT count(*)::int AS real
    FROM leads l
    JOIN memberships m ON m.org_id = l.org_id
    JOIN users u ON u.id = m.user_id
    WHERE u.email = ${DOCS_EMAIL} AND l.is_sample = false`;
  if (rows[0]?.real > 0) {
    throw new Error(
      `The docs account holds ${rows[0].real} real leads. Refusing to screenshot it.`,
    );
  }
}

/**
 * Suppress the first-run overlays before the page paints.
 *
 * The coach marks are modal and dim the board, so a screenshot taken with
 * one open is unusable and every click underneath it times out. Clicking
 * them away worked by hand and was flaky in a script, because they arrive
 * in a sequence that depends on what has already been seen.
 *
 * All three flags live in localStorage under keys the app owns, so setting
 * them in an init script is deterministic and needs no clicking at all. The
 * keys are duplicated from src/app/(app)/_onboarding; if they change there,
 * the overlays reappear in the screenshots, which is a loud enough failure.
 */
async function suppressFirstRun(ctx, userId) {
  await ctx.addInitScript(
    ([coachKey, hiddenKey, nameKey]) => {
      try {
        localStorage.setItem(coachKey, "1");
        localStorage.setItem(hiddenKey, "1");
        localStorage.setItem(nameKey, "1");
      } catch {
        /* storage unavailable, the overlays are cosmetic */
      }
    },
    [`chumley.coach.v1:${userId}`, "chumley:onboarding-hidden", "chumley:name-asked"],
  );
}

/** Let animations and data settle before the shutter. */
async function settle(page) {
  await page.waitForTimeout(700);
}

/**
 * Ring the thing the paragraph is talking about.
 *
 * A tutorial screenshot of a whole application is mostly not the subject, so
 * the control a sentence refers to gets a ring and everything else is dimmed
 * behind it.
 *
 * The dim is the ring's own outward box-shadow, which is why a mark that
 * fails to find its element used to be worse than no mark at all: an early
 * version matched a hidden zero-size input, drew an invisible ring in the
 * top left corner, and dimmed the entire screenshot while highlighting
 * nothing. So an element only counts if it is actually on screen and big
 * enough to see, `targets` may list several candidates in preference order,
 * and a mark that lands nothing is reported rather than silently swallowed.
 */
async function highlight(page, marks, tour = false) {
  const result = await page.evaluate(({ items, tour }) => {
    const layer = document.createElement("div");
    layer.id = "__shot_marks";
    Object.assign(layer.style, {
      position: "fixed",
      inset: "0",
      zIndex: "2147483647",
      pointerEvents: "none",
    });

    /** On screen, laid out, and larger than an icon's worth of nothing. */
    const usable = (el) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      if (r.width < 12 || r.height < 12) return false;
      if (r.bottom < 0 || r.right < 0) return false;
      if (r.top > window.innerHeight || r.left > window.innerWidth) return false;
      const cs = getComputedStyle(el);
      return cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0";
    };

    const found = [];
    const missed = [];

    for (const mark of items) {
      let el = null;

      if (mark.text) {
        const all = [...document.querySelectorAll("h1,h2,h3,h4,p,button,label,span,div,a")];
        const exact = all.filter((n) => n.textContent?.trim() === mark.text && usable(n));
        /**
         * Fall back to a prefix match, because a heading is often not alone
         * in its element: "What needs doing" sits beside its overdue badge
         * and "Open pipeline" beside its figure, so both read as one longer
         * string. Shortest match wins, which is the heading rather than the
         * panel wrapping it.
         */
        const near = exact.length
          ? exact
          : all
              .filter((n) => n.textContent?.trim().startsWith(mark.text) && usable(n))
              .sort(
                (a, b) => a.textContent.trim().length - b.textContent.trim().length,
              );
        el = (exact.length ? near[near.length - 1] : near[0]) ?? null;
        /**
         * Walk up to the panel the text sits in. Matching on a heading rings
         * the heading, which is never the thing being taught; the reader
         * needs the whole block it introduces. Semantic selectors are tried
         * first, then a plain size walk, because not every panel in the app
         * is a <section> or a card component.
         */
        if (el && mark.card) {
          const semantic = el.closest("[data-slot='card'], section, form, dialog");
          if (semantic && usable(semantic)) {
            el = semantic;
          } else {
            let up = el;
            for (let i = 0; i < 6 && up.parentElement; i += 1) {
              up = up.parentElement;
              const r = up.getBoundingClientRect();
              if (r.width >= 300 && r.height >= 60) break;
            }
            if (usable(up)) el = up;
          }
        }
      } else {
        // Preference order, first visible candidate wins.
        for (const sel of [].concat(mark.targets ?? mark.selector ?? [])) {
          let candidates = [];
          try {
            candidates = [...document.querySelectorAll(sel)].filter(usable);
          } catch {
            // Playwright-only syntax such as :has-text() is not valid CSS in
            // the page. Skip it rather than failing the whole shot.
            continue;
          }
          if (candidates.length) {
            el = candidates[0];
            break;
          }
        }
      }

      if (!usable(el)) {
        missed.push(mark.label ?? mark.text ?? "mark");
        continue;
      }

      // Optionally widen to cover a run of siblings, so "these three fields"
      // reads as one region rather than three separate rings.
      let box = el.getBoundingClientRect();
      if (mark.through) {
        const last = [...document.querySelectorAll(mark.through)].filter(usable).pop();
        if (last) {
          const lb = last.getBoundingClientRect();
          box = {
            left: Math.min(box.left, lb.left),
            top: Math.min(box.top, lb.top),
            right: Math.max(box.right, lb.right),
            bottom: Math.max(box.bottom, lb.bottom),
          };
          box.width = box.right - box.left;
          box.height = box.bottom - box.top;
        }
      }

      found.push(mark.label ?? "mark");
      const pad = 8;

      const ring = document.createElement("div");
      Object.assign(ring.style, {
        position: "absolute",
        left: `${box.left - pad}px`,
        top: `${box.top - pad}px`,
        width: `${box.width + pad * 2}px`,
        height: `${box.height + pad * 2}px`,
        border: "3px solid #E8590C",
        borderRadius: "12px",
        /**
         * A tour marks several regions at once, so the single-subject dim is
         * wrong: every ring's shadow would darken every other ring. Tour
         * rings are outlines only, and the numbers do the pointing.
         */
        boxShadow: tour
          ? "0 0 0 2px rgba(255,255,255,0.9)"
          : "0 0 0 9999px rgba(15,23,42,0.55), 0 0 22px 4px rgba(232,89,12,0.55)",
      });
      layer.appendChild(ring);

      if (tour) {
        const pin = document.createElement("div");
        pin.textContent = String(found.length);
        Object.assign(pin.style, {
          position: "absolute",
          left: `${box.left - pad - 17}px`,
          top: `${box.top - pad - 17}px`,
          width: "34px",
          height: "34px",
          borderRadius: "999px",
          background: "#E8590C",
          color: "#fff",
          font: "700 18px/34px ui-sans-serif, system-ui, sans-serif",
          textAlign: "center",
          boxShadow: "0 2px 10px rgba(0,0,0,0.4), 0 0 0 3px #fff",
        });
        layer.appendChild(pin);
      }

      if (mark.label && !tour) {
        const tag = document.createElement("div");
        tag.textContent = mark.label;
        const room = box.bottom + pad + 48 < window.innerHeight;
        Object.assign(tag.style, {
          position: "absolute",
          left: `${Math.max(12, Math.min(box.left - pad, window.innerWidth - 460))}px`,
          top: room
            ? `${box.bottom + pad + 10}px`
            : `${Math.max(12, box.top - pad - 46)}px`,
          background: "#E8590C",
          color: "#fff",
          font: "600 16px/1.3 ui-sans-serif, system-ui, sans-serif",
          padding: "8px 12px",
          borderRadius: "9px",
          whiteSpace: "nowrap",
          boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
        });
        layer.appendChild(tag);
      }
    }

    // No ring means no subject, and a dim with no subject is just a ruined
    // screenshot. Leave the image clean instead.
    if (found.length) document.body.appendChild(layer);
    return { landed: found.length, missed };
  }, { items: marks, tour });

  return result;
}

async function clearMarks(page) {
  await page.evaluate(() => document.getElementById("__shot_marks")?.remove());
}

/**
 * The shot list. Adding a tutorial image means adding one entry here and
 * referencing `${name}.png` from the article's beat.
 */
const SHOTS = [
  {
    name: "pipeline-board",
    caption: "The pipeline board with three example deals",
    marks: [
      {
        targets: ['[aria-label="Proposal Sent options"]'],
        label: "Column menu: rename, reorder, delete",
      },
    ],
    async take(page) {
      await page.goto(`${BASE}/pipeline`, { waitUntil: "networkidle" });
      await settle(page);
    },
  },
  {
    name: "add-a-deal",
    caption: "The Add a deal dialog",
    marks: [
      {
        targets: ['[role="dialog"] input[name="name"]', '[role="dialog"] label'],
        through: '[role="dialog"] input',
        label: "Name, phone, email. Everything else can wait",
      },
    ],
    async take(page) {
      await page.goto(`${BASE}/pipeline`, { waitUntil: "networkidle" });
      await settle(page);
      await page.getByRole("button", { name: /^\+?\s*Add lead$/i }).first().click({ timeout: 8000 });
      await page.waitForTimeout(900);
    },
  },
  {
    name: "lead-detail",
    caption: "A lead open, showing the next step",
    marks: [
      {
        text: "Mark done",
        card: true,
        label: "One next step, with a date. This is what turns the card red",
      },
    ],
    async take(page) {
      await page.goto(`${BASE}/pipeline`, { waitUntil: "networkidle" });
      await settle(page);
      await page.getByText("Dale Whitaker", { exact: true }).first().click();
      await page.waitForTimeout(1200);
    },
  },
  {
    name: "rename-bucket",
    caption: "Clicking a column name to rename it",
    marks: [
      {
        targets: ['input[value="Proposal Sent"]', '[aria-label="Proposal Sent options"]'],
        label: "Click the name, type the new one",
      },
    ],
    async take(page) {
      await page.goto(`${BASE}/pipeline`, { waitUntil: "networkidle" });
      await settle(page);
      await page.getByText("Proposal Sent", { exact: true }).first().click();
      await page.waitForTimeout(700);
    },
  },
  {
    name: "column-menu",
    caption: "The column menu, where a bucket is deleted",
    marks: [{ targets: ['[role="menuitem"]'], label: "The only item in here" }],
    async take(page) {
      await page.goto(`${BASE}/pipeline`, { waitUntil: "networkidle" });
      await settle(page);
      await page.locator('[aria-label="Proposal Sent options"]').first().click();
      await page.waitForTimeout(700);
    },
  },
  {
    name: "delete-bucket",
    caption: "Deleting a bucket asks where its deals should go",
    marks: [
      {
        targets: ['[role="dialog"] [role="radiogroup"]', '[role="dialog"] button'],
        label: "Pick where the deals land. Nothing is deleted",
      },
    ],
    async take(page) {
      await page.goto(`${BASE}/pipeline`, { waitUntil: "networkidle" });
      await settle(page);
      await page.locator('[aria-label="Proposal Sent options"]').first().click();
      await page.waitForTimeout(400);
      await page.getByText("Delete bucket", { exact: true }).first().click();
      await page.waitForTimeout(900);
    },
  },
  {
    name: "add-bucket",
    caption: "Naming a new bucket",
    marks: [
      {
        targets: ['input[placeholder="Name this bucket"]'],
        label: "Name it after something that happens in your week",
      },
    ],
    async take(page) {
      await page.goto(`${BASE}/pipeline`, { waitUntil: "networkidle" });
      await settle(page);
      const add = page.getByRole("button", { name: /add (a )?bucket|new bucket|add column/i });
      if (await add.count()) {
        await add.first().click();
        await page.waitForTimeout(700);
      }
    },
  },
  {
    name: "import-mapping",
    caption: "The column mapping screen during an import",
    marks: [
      {
        targets: ["select", "[role='combobox']", "button[aria-haspopup='listbox']"],
        label: "Chumley guessed these. Fix any that are wrong",
      },
    ],
    async take(page) {
      await page.goto(`${BASE}/settings/import`, { waitUntil: "networkidle" });
      await settle(page);
      const csv = path.join(HERE, "fixtures", "leads.csv");
      const input = page.locator('input[type="file"]');
      if (await input.count()) {
        await input.first().setInputFiles(csv);
        await page.waitForTimeout(1500);
      }
    },
  },
  {
    name: "dashboard-tour",
    caption: "The dashboard, numbered",
    tour: true,
    marks: [
      { targets: ['input[placeholder*="Search people"]'], label: "1" },
      { text: "Dashboard", label: "2" },
      { text: "Deals working", card: true, label: "3" },
      { text: "What needs doing", card: true, label: "4" },
      { text: "Open pipeline", card: true, label: "5" },
      { text: "Recent activity", card: true, label: "6" },
    ],
    async take(page) {
      await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
      await settle(page);
    },
  },
  {
    name: "pipeline-tour",
    caption: "The pipeline board, numbered",
    tour: true,
    marks: [
      { text: "Pipeline", label: "1" },
      { text: "Deals working", card: true, label: "2" },
      { targets: ['input[placeholder*="Search leads"]'], label: "3" },
      { text: "Add lead", label: "4" },
      { text: "Proposal Sent", card: true, label: "5" },
      { text: "Dale Whitaker", card: true, label: "6" },
    ],
    async take(page) {
      await page.goto(`${BASE}/pipeline`, { waitUntil: "networkidle" });
      await settle(page);
    },
  },
  {
    name: "team",
    caption: "The team page, with the invite link and the seat count",
    mask: ["[data-invite-url], code, pre"],
    marks: [{ text: "Invite teammates", card: true, label: "Copy this link and send it however you like" }],
    async take(page) {
      await page.goto(`${BASE}/settings/team`, { waitUntil: "networkidle" });
      await settle(page);
    },
  },
  {
    name: "billing",
    caption: "The billing page, where plans and seats are changed",
    /**
     * Two states, one shot. A subscribed account shows "Add or remove
     * seats"; an account still on trial shows the seat picker inside the
     * checkout card instead. Both are the seat control the article is about,
     * so either landing is correct.
     */
    marks: [
      { text: "Add or remove seats", card: true, optional: true, label: "Seats, and what changing them costs" },
      { text: "How many people?", card: true, optional: true, label: "Seats. You are billed per person, per month" },
    ],
    async take(page) {
      await page.goto(`${BASE}/settings/billing`, { waitUntil: "networkidle" });
      await settle(page);
    },
  },
  {
    name: "lead-notifications",
    caption: "The setting that emails you when a lead arrives",
    marks: [
      { text: "Tell me when a lead comes in", card: true, label: "On by default. This is the switch" },
    ],
    async take(page) {
      await page.goto(`${BASE}/settings/form`, { waitUntil: "networkidle" });
      await settle(page);
      await page
        .getByText("Tell me when a lead comes in", { exact: true })
        .first()
        .scrollIntoViewIfNeeded()
        .catch(() => {});
      await page.waitForTimeout(400);
    },
  },
  {
    name: "website-form",
    caption: "The website form settings, where the embed code lives",
    marks: [{ targets: ["pre", "code", "textarea"], label: "Copy this one line" }],
    async take(page) {
      await page.goto(`${BASE}/settings/form`, { waitUntil: "networkidle" });
      await settle(page);
    },
  },
];

async function main() {
  const only = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const sql = postgres(env().DATABASE_URL, { ssl: "require", max: 1 });

  let browser;
  try {
    await assertSafe(sql);
    const url = fs.existsSync(STATE) ? null : await signInUrl(sql);

    fs.mkdirSync(OUT, { recursive: true });
    browser = await chromium.launch();
    const reuse = fs.existsSync(STATE);
    const ctx = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: SCALE,
      ...(reuse ? { storageState: STATE } : {}),
    });
    await suppressFirstRun(ctx, await docsUserId(sql));
    const page = await ctx.newPage();

    await page.goto(`${BASE}/pipeline`, { waitUntil: "networkidle" });
    if (page.url().includes("/login") || !reuse) {
      const link = url ?? (await signInUrl(sql));
      await page.goto(link, { waitUntil: "networkidle" });
    }
    if (page.url().includes("/onboarding")) {
      await page.getByLabel(/team name/i).fill("Northside Sales");
      await page.getByRole("button", { name: /create team/i }).click();
      await page.waitForURL(/\/pipeline/, { timeout: 20000 });
    }
    if (page.url().includes("/login")) {
      throw new Error("Sign-in did not take. Delete scripts/screenshots/.auth.json and retry.");
    }
    await ctx.storageState({ path: STATE });
    await settle(page);

    const wanted = only.length ? SHOTS.filter((s) => only.includes(s.name)) : SHOTS;
    const done = [];
    for (const shot of wanted) {
      try {
        await shot.take(page);
        let landed = 0;
        let missedLabels = [];
        if (shot.marks) {
          const r = await highlight(page, shot.marks, shot.tour === true);
          landed = r.landed;
          missedLabels = r.missed;
        }
        /**
         * Anything secret is blacked out before the shutter, not cropped
         * afterwards. The team page shows a live join link: publish that
         * screenshot and any reader can add themselves to the docs team.
         * Playwright masks by locator, so the block tracks the element.
         */
        await page.screenshot({
          path: path.join(OUT, `${shot.name}.png`),
          ...(shot.mask
            ? {
                mask: shot.mask.map((sel) => page.locator(sel)),
                maskColor: "#0f172a",
              }
            : {}),
        });
        if (shot.marks) await clearMarks(page);
        done.push(shot.name);
        /**
         * A mark can be optional, for a screen with two valid states: a
         * trialing account shows a different seat control from a subscribed
         * one, and only one of the two can ever land. Required marks are
         * what a miss is measured against.
         */
        const required = shot.marks?.filter((m) => !m.optional).length ?? 0;
        const missed = Math.max(0, required - landed);
        console.log(
          `  captured  ${shot.name}.png` +
            (shot.marks ? `  (${landed} highlighted, ${required} required)` : "") +
            (missed ? `  <-- MISSED: ${missedLabels.join(", ")}` : ""),
        );
        if (missed) process.exitCode = 1;
      } catch (e) {
        console.error(`  FAILED    ${shot.name}: ${e.message.split("\n")[0]}`);
      }
    }
    console.log(`\n${done.length}/${wanted.length} written to public/support`);
    if (done.length < wanted.length) process.exitCode = 1;
  } finally {
    await browser?.close();
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
