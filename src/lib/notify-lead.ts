import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { organizations, memberships } from "@/db/schema";
import { users } from "@/db/auth-schema";

/**
 * Telling somebody a lead arrived.
 *
 * The gap this closes is the one the product is sold on. A contractor's
 * website form is filled in at nine at night, the lead lands on a board
 * nobody is looking at, and it sits there. Chumley's whole pitch is the
 * NAHB figure, that forty to sixty percent of bids are lost because the
 * second call never happened, so a lead arriving silently is precisely the
 * failure it exists to prevent.
 *
 * Only inbound leads notify. Typing one in by hand does not, because you
 * were there when it happened and an email about your own keystrokes is
 * noise, and noise is what makes people switch notifications off.
 *
 * Three rules, all of them borrowed from alert.ts, all of them learned the
 * same way:
 *
 * It never throws. A notifier that can break the thing it watches is a
 * liability, and losing a lead because the email about it failed would be
 * a considerably worse bug than the one being fixed.
 *
 * It never blocks. The caller is answering a stranger's form submission
 * and that request should not wait on an SMTP round trip.
 *
 * It throttles, and counts what it skipped. A form under a bot attack must
 * produce one message, not two hundred, and the next message has to say
 * how many arrived quietly rather than pretending they did not.
 */

const FROM = process.env.ALERT_FROM ?? "Chumley <onboarding@resend.dev>";

/** Long enough that a burst is one email, short enough to still be news. */
const QUIET_MINUTES = 10;

function siteUrl() {
  return (
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://chumley.app"
  );
}

/**
 * Claim the right to send, or find that somebody just did.
 *
 * Returns how many other leads arrived during the quiet window, or null if
 * this one is not the sender. The counting and the claiming are one
 * statement so two submissions landing together cannot both send.
 */
async function claim(orgId: string): Promise<number | null> {
  const rows = (await db.execute(sql`
    WITH prev AS (
      -- Read before the upsert writes. Postgres evaluates a CTE against
      -- the statement's snapshot, so this is the count that accumulated
      -- during the quiet window. RETURNING alone gives the post-update
      -- value, which the reset below has already zeroed, and the email
      -- would say "and 0 more" after suppressing nineteen.
      SELECT pending FROM lead_notice_log WHERE org_id = ${orgId}::uuid
    )
    INSERT INTO lead_notice_log (org_id, last_sent_at, pending)
    VALUES (${orgId}::uuid, now(), 0)
    ON CONFLICT (org_id) DO UPDATE
      SET last_sent_at = CASE
            WHEN lead_notice_log.last_sent_at
                 < now() - (${QUIET_MINUTES} || ' minutes')::interval
            THEN now() ELSE lead_notice_log.last_sent_at END,
          pending = CASE
            WHEN lead_notice_log.last_sent_at
                 < now() - (${QUIET_MINUTES} || ' minutes')::interval
            THEN 0 ELSE lead_notice_log.pending + 1 END
    RETURNING
      COALESCE((SELECT pending FROM prev), 0) AS pending,
      (last_sent_at = now()) AS sending
  `)) as unknown as { pending: number; sending: boolean }[];

  const row = rows[0];
  if (!row?.sending) return null;
  return Number(row.pending ?? 0);
}

/** The owner's address. Inbound leads have no human attached to them. */
async function ownerEmail(orgId: string): Promise<string | null> {
  const rows = await db
    .select({ email: users.email })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(sql`${memberships.orgId} = ${orgId} AND ${memberships.role} = 'owner'`)
    .orderBy(memberships.createdAt)
    .limit(1);
  return rows[0]?.email ?? null;
}

export type NewLeadNotice = {
  orgId: string;
  leadId: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  /** "your website form" or "your webhook", for the one line of context. */
  source: string;
};

async function send(to: string, lead: NewLeadNotice, alsoWaiting: number) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("[lead notice] RESEND_API_KEY unset, not sending");
    return;
  }

  const who = lead.company ? `${lead.name} at ${lead.company}` : lead.name;

  const lines = [
    `${who} just came in from ${lead.source}.`,
    "",
    lead.phone ? `Phone:  ${lead.phone}` : null,
    lead.email ? `Email:  ${lead.email}` : null,
    "",
    `Open the deal: ${siteUrl()}/pipeline?lead=${lead.leadId}`,
    alsoWaiting > 0
      ? `\n${alsoWaiting} more came in while you were away. They are all on your board.`
      : null,
    "",
    "---",
    "Turn these off in Settings, Form for your website.",
  ].filter((l) => l !== null);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    // The subject has to be useful on a lock screen without opening it,
    // so the name comes first and the word "lead" second.
    body: JSON.stringify({
      from: FROM,
      to,
      subject:
        alsoWaiting > 0
          ? `${who} and ${alsoWaiting} more new leads`
          : `New lead: ${who}`,
      text: lines.join("\n"),
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    console.error("[lead notice] resend rejected", res.status, await res.text());
  }
}

/**
 * Fire and forget. Deliberately not awaited by callers: a stranger's form
 * submission must not wait on an email, and must never fail because of one.
 */
export function notifyNewLead(lead: NewLeadNotice): void {
  void (async () => {
    try {
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, lead.orgId),
        columns: { notifyNewLeads: true, deactivatedAt: true },
      });
      if (!org?.notifyNewLeads || org.deactivatedAt) return;

      const alsoWaiting = await claim(lead.orgId);
      if (alsoWaiting === null) return; // inside the quiet window

      const to = await ownerEmail(lead.orgId);
      if (!to) return;

      await send(to, lead, alsoWaiting);
    } catch (e) {
      // Swallowed, always. See the note at the top of this file.
      console.error("[lead notice] failed", e);
    }
  })();
}
