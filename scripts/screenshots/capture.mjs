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
 * A tutorial screenshot of a full application is mostly not the subject, and
 * a reader should not have to hunt for the one control a sentence refers to.
 * This draws a brand-coloured ring, and optionally a label, over the element
 * a shot names, then removes it so a later shot in the same page is clean.
 *
 * It measures the live element rather than taking coordinates, so a layout
 * change moves the ring instead of leaving it pointing at empty space.
 */
async function highlight(page, marks) {
  await page.evaluate((items) => {
    const layer = document.createElement("div");
    layer.id = "__shot_marks";
    Object.assign(layer.style, {
      position: "fixed",
      inset: "0",
      zIndex: "2147483647",
      pointerEvents: "none",
    });

    for (const { selector, label } of items) {
      const el = document.querySelector(selector);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const pad = 6;

      const ring = document.createElement("div");
      Object.assign(ring.style, {
        position: "absolute",
        left: `${r.left - pad}px`,
        top: `${r.top - pad}px`,
        width: `${r.width + pad * 2}px`,
        height: `${r.height + pad * 2}px`,
        border: "3px solid #E8590C",
        borderRadius: "10px",
        boxShadow: "0 0 0 9999px rgba(15,23,42,0.35)",
      });
      layer.appendChild(ring);

      if (label) {
        const tag = document.createElement("div");
        tag.textContent = label;
        /**
         * Below by default. A label above a control tends to land on the
         * sentence explaining that control, which is exactly the text a
         * reader needs. Flip above only when there is no room underneath.
         */
        const below = r.bottom + pad + 44 < window.innerHeight;
        Object.assign(tag.style, {
          position: "absolute",
          left: `${r.left - pad}px`,
          [below ? "top" : "bottom"]: below
            ? `${r.bottom + pad + 8}px`
            : `${window.innerHeight - r.top + pad + 8}px`,
          background: "#E8590C",
          color: "#fff",
          font: "600 15px/1.3 ui-sans-serif, system-ui, sans-serif",
          padding: "6px 10px",
          borderRadius: "8px",
          whiteSpace: "nowrap",
        });
        layer.appendChild(tag);
      }
    }
    document.body.appendChild(layer);
  }, marks);
  await page.waitForTimeout(150);
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
    marks: [{ selector: '[aria-label="Proposal Sent options"]', label: "Column menu: rename, reorder, delete" }],
    async take(page) {
      await page.goto(`${BASE}/pipeline`, { waitUntil: "networkidle" });
      await settle(page);
    },
  },
  {
    name: "add-a-deal",
    caption: "The Add a deal dialog",
    marks: [{ selector: '[role="dialog"] input', label: "Name, phone, email. Everything else can wait" }],
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
    marks: [{ selector: '[role="dialog"] input, [role="dialog"] textarea', label: "The next step is the part that earns its keep" }],
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
    marks: [{ selector: 'input[value="Proposal Sent"]', label: "Click the name, type the new one" }],
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
    marks: [{ selector: '[role="menuitem"]', label: "Delete bucket" }],
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
    marks: [{ selector: '[role="dialog"] button, [role="dialog"] select', label: "Pick where the deals land. Nothing is deleted" }],
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
    marks: [{ selector: 'input[placeholder="Name this bucket"]', label: "Name it after something that happens in your week" }],
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
    marks: [{ selector: "select, [role='combobox']", label: "Chumley guessed these. Fix any that are wrong" }],
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
    name: "website-form",
    caption: "The website form settings, where the embed code lives",
    marks: [{ selector: "code, pre", label: "Copy this one line" }],
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
        if (shot.marks) await highlight(page, shot.marks);
        await page.screenshot({ path: path.join(OUT, `${shot.name}.png`) });
        if (shot.marks) await clearMarks(page);
        done.push(shot.name);
        console.log(`  captured  ${shot.name}.png`);
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
