"use server";

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { toolSignups } from "@/db/schema";

/**
 * Handing over the free tracker in exchange for an email.
 *
 * The link comes back on screen straight away as well as going out by
 * email. Making somebody leave the page and go hunting in their inbox loses
 * a large share of them, and the competing pages from OnePageCRM and
 * Salesmate do not gate at all, so the friction has to be worth something.
 * Asking for the address is worth it. Asking them to go and fetch it is not.
 *
 * Both copies of the link carry the same token and both run through the
 * redirect route, so a download is counted whichever one they use.
 */

const TOOL = "sales-pipeline-tracker";

/** Deliberately loose. Rejecting odd but valid addresses costs more than a bad row. */
const LOOKS_LIKE_EMAIL = /^[^@\s]+@[^@\s.]+\.[^@\s]{2,}$/;

export type SignupState = {
  error: string | null;
  /** The tracked link, set once the row exists. */
  link: string | null;
};

function baseUrl() {
  return (
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://chumley.app"
  );
}

async function emailTheLink(to: string, link: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("[tool signup] RESEND_API_KEY unset, not emailing", to);
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.ALERT_FROM ?? "Chumley <onboarding@resend.dev>",
        to,
        subject: "Your free Sales Pipeline Tracker",
        text: [
          "Here is the tracker you asked for.",
          "",
          link,
          "",
          "Open it, then choose File and Make a copy. It is yours after that,",
          "and it works in Google Sheets or Excel.",
          "",
          "Two things it does on its own. A row turns pink when the next step",
          "is due or late, and green when you mark it Won.",
          "",
          "That sheet works until three things happen: you need it on your",
          "phone, you need it to remind you, or somebody else needs to see it.",
          "That is the point where Chumley is worth a look.",
          "",
          "https://chumley.app",
        ].join("\n"),
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error("[tool signup] resend rejected", res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("[tool signup] resend threw", e);
    return false;
  }
}

export async function requestTracker(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  // Bots fill in every field they can find. Nobody real sees this one.
  if (String(formData.get("website") ?? "").trim()) {
    return { error: null, link: `${baseUrl()}/tools/${TOOL}/get` };
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 200);

  if (!email) return { error: "Pop your email in and it is yours.", link: null };
  if (!LOOKS_LIKE_EMAIL.test(email)) {
    return { error: "That does not look like an email address.", link: null };
  }

  const source = String(formData.get("source") ?? "").trim().slice(0, 120) || null;

  try {
    /**
     * Coming back a second time is not an error, it is somebody who lost
     * the link. Return the same token rather than refusing, so the second
     * visit works exactly like the first.
     */
    const [row] = await db
      .insert(toolSignups)
      .values({ email, tool: TOOL, source })
      .onConflictDoUpdate({
        target: [toolSignups.email, toolSignups.tool],
        set: { source: sql`COALESCE(${toolSignups.source}, ${source})` },
      })
      .returning({ token: toolSignups.token });

    if (!row) return { error: "Something went wrong. Try again?", link: null };

    const link = `${baseUrl()}/tools/${TOOL}/get?t=${row.token}`;

    // Awaited on purpose. A serverless function can be frozen the moment it
    // responds, so a floating promise here is a coin flip on whether the
    // email ever leaves.
    const sent = await emailTheLink(email, link);
    if (sent) {
      await db
        .update(toolSignups)
        .set({ emailedAt: new Date() })
        .where(
          and(eq(toolSignups.email, email), eq(toolSignups.tool, TOOL)),
        );
    }

    // The link is returned either way. A failed email must not cost somebody
    // the thing they just asked for.
    return { error: null, link };
  } catch (e) {
    console.error("[tool signup] failed", e);
    return { error: "Something went wrong. Try again?", link: null };
  }
}
