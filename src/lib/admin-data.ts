import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { TRIAL_DAYS } from "@/app/(marketing)/pricing/plans";

/**
 * What is actually true about a team's billing, rather than a label.
 *
 * "free" is not an absence of information: while Chumley is in early access
 * most teams have no subscription at all, and calling that "inactive"
 * would read as something being wrong.
 */
export type AccountStatus =
  | "off"
  | "comped"
  | "trial"
  | "trial_ended"
  | "trialing"
  | "active"
  | "past_due"
  | "paused"
  | "ending"
  | "canceled";

export type AdminAccount = {
  orgId: string;
  name: string;
  status: AccountStatus;
  /** Switched off by an administrator. Outranks whatever billing says. */
  deactivated: boolean;
  /** On a free account granted by an administrator. */
  comped: boolean;
  /** Days remaining in the free trial. Null unless the status is "trial". */
  trialDaysLeft: number | null;
  /** Negotiated price in cents per seat per month. Null is list pricing. */
  customPriceCents: number | null;
  customPriceReason: string | null;
  /** When the comp runs out. Null while comped means indefinitely. */
  compedUntil: Date | null;
  compedReason: string | null;
  /** Set when a cancellation is scheduled but has not taken effect. */
  endsAt: Date | null;
  seats: number | null;
  ownerEmail: string | null;
  members: number;
  realLeads: number;
  sampleLeads: number;
  contacts: number;
  activities: number;
  createdAt: Date;
  lastActivityAt: Date | null;
};

export type AdminUser = {
  id: string;
  email: string | null;
  providers: string[];
  createdAt: Date;
  lastSignInAt: Date | null;
  teamName: string | null;
  role: string | null;
};

export type AdminReport = {
  id: string;
  kind: "broke" | "confusing" | "idea" | "praise";
  message: string;
  email: string | null;
  orgName: string | null;
  pageUrl: string | null;
  userAgent: string | null;
  status: "new" | "read" | "closed";
  createdAt: Date;
};

export type AdminMetrics = {
  users: number;
  teams: number;
  newUsers7d: number;
  /** Teams that have added at least one lead of their own. */
  activatedTeams: number;
  realLeads: number;
  activities: number;
  /** Reports nobody has looked at yet. The number worth acting on. */
  newReports: number;
};

/**
 * Everything the back office reads, in three queries rather than a loop of
 * hundreds. Sample leads are counted separately throughout, because a team
 * that has only the three we seeded has not started, and a dashboard that
 * cannot tell the difference will report adoption that is not there.
 */
export async function getAdminMetrics(): Promise<AdminMetrics> {
  const rows = (await db.execute(sql`
    SELECT
      (SELECT count(*) FROM users)::int AS users,
      (SELECT count(*) FROM organizations)::int AS teams,
      (SELECT count(*) FROM users
         WHERE created_at > now() - interval '7 days')::int AS new_users_7d,
      (SELECT count(DISTINCT org_id) FROM leads
         WHERE is_sample = false)::int AS activated_teams,
      (SELECT count(*) FROM leads WHERE is_sample = false)::int AS real_leads,
      (SELECT count(*) FROM activities)::int AS activities,
      (SELECT count(*) FROM problem_reports
        WHERE status = 'new')::int AS new_reports
  `)) as unknown as Record<string, number>[];

  const r = rows[0];
  return {
    users: Number(r.users),
    teams: Number(r.teams),
    newUsers7d: Number(r.new_users_7d),
    activatedTeams: Number(r.activated_teams),
    realLeads: Number(r.real_leads),
    activities: Number(r.activities),
    newReports: Number(r.new_reports),
  };
}

/**
 * A pending cancellation outranks the status it is pending on. Paddle
 * keeps a subscription "active" right up to the date, which is correct
 * for access and useless for a column headed Status.
 *
 * With no subscription at all the answer comes from the team's own age,
 * not from Paddle, because the free trial runs from the day they signed up
 * and needs no card. "Free" used to be returned here and was wrong twice
 * over: it read as a permanent state when it expires in a fortnight, and
 * it collided with the genuinely free accounts an administrator grants.
 */
function statusOf(
  raw: unknown,
  change: unknown,
  daysLeft: number
): AccountStatus {
  if (!raw) return daysLeft > 0 ? "trial" : "trial_ended";
  if (change === "cancel") return "ending";
  const known: AccountStatus[] = [
    "trialing",
    "active",
    "past_due",
    "paused",
    "canceled",
  ];
  const value = String(raw) as AccountStatus;
  return known.includes(value) ? value : "trial_ended";
}

export async function getAdminAccounts(): Promise<AdminAccount[]> {
  const rows = (await db.execute(sql`
    SELECT
      o.id                AS org_id,
      o.name              AS name,
      o.created_at        AS created_at,
      (SELECT u.email FROM memberships m
         JOIN users u ON u.id = m.user_id
        WHERE m.org_id = o.id AND m.role = 'owner'
        ORDER BY m.created_at LIMIT 1)                       AS owner_email,
      (SELECT count(*) FROM memberships m
        WHERE m.org_id = o.id)::int                          AS members,
      (SELECT count(*) FROM leads l
        WHERE l.org_id = o.id AND l.is_sample = false
          AND l.stage <> 'contact')::int                     AS real_leads,
      (SELECT count(*) FROM leads l
        WHERE l.org_id = o.id AND l.is_sample = true)::int    AS sample_leads,
      (SELECT count(*) FROM leads l
        WHERE l.org_id = o.id AND l.stage = 'contact')::int   AS contacts,
      (SELECT count(*) FROM activities a
        WHERE a.org_id = o.id)::int                          AS activities,
      (SELECT max(a.created_at) FROM activities a
        WHERE a.org_id = o.id)                               AS last_activity_at,
      (SELECT s.status FROM subscriptions s
        WHERE s.org_id = o.id
        ORDER BY s.created_at DESC LIMIT 1)                  AS sub_status,
      (SELECT s.scheduled_change_action FROM subscriptions s
        WHERE s.org_id = o.id
        ORDER BY s.created_at DESC LIMIT 1)                  AS sub_change,
      (SELECT s.scheduled_change_at FROM subscriptions s
        WHERE s.org_id = o.id
        ORDER BY s.created_at DESC LIMIT 1)                  AS sub_ends_at,
      (SELECT s.quantity FROM subscriptions s
        WHERE s.org_id = o.id
        ORDER BY s.created_at DESC LIMIT 1)                  AS sub_seats,
      o.deactivated_at                                       AS deactivated_at,
      o.comped_at                                            AS comped_at,
      o.comped_until                                         AS comped_until,
      o.comped_reason                                        AS comped_reason,
      o.custom_price_cents                                   AS custom_price_cents,
      o.custom_price_reason                                  AS custom_price_reason
    FROM organizations o
    ORDER BY o.created_at DESC
  `)) as unknown as Record<string, unknown>[];

  return rows.map((r) => {
    // A comp that has run out is not a comp. The column is left in place so
    // the reason survives, but it stops deciding anything.
    const compedUntil = r.comped_until
      ? new Date(String(r.comped_until))
      : null;
    const comped =
      Boolean(r.comped_at) &&
      (compedUntil === null || compedUntil.getTime() > Date.now());

    // Whole days, rounded up, so a team on its final afternoon still reads
    // "1 day left" rather than zero while they can still use the thing.
    const created = new Date(r.created_at as string);
    const elapsedDays = (Date.now() - created.getTime()) / 86_400_000;
    const daysLeft = Math.max(0, Math.ceil(TRIAL_DAYS - elapsedDays));
    const status: AccountStatus = r.deactivated_at
      ? "off"
      : comped
        ? "comped"
        : statusOf(r.sub_status, r.sub_change, daysLeft);

    return {
    orgId: String(r.org_id),
    status,
    trialDaysLeft: status === "trial" ? daysLeft : null,
    deactivated: Boolean(r.deactivated_at),
    comped,
    compedUntil,
    compedReason: r.comped_reason ? String(r.comped_reason) : null,
    customPriceCents:
      r.custom_price_cents === null || r.custom_price_cents === undefined
        ? null
        : Number(r.custom_price_cents),
    customPriceReason: r.custom_price_reason
      ? String(r.custom_price_reason)
      : null,
    endsAt: r.sub_ends_at ? new Date(String(r.sub_ends_at)) : null,
    seats: r.sub_seats === null || r.sub_seats === undefined
      ? null
      : Number(r.sub_seats),
    name: String(r.name),
    ownerEmail: (r.owner_email as string) ?? null,
    members: Number(r.members),
    realLeads: Number(r.real_leads),
    sampleLeads: Number(r.sample_leads),
    contacts: Number(r.contacts),
    activities: Number(r.activities),
    createdAt: new Date(r.created_at as string),
    lastActivityAt: r.last_activity_at
      ? new Date(r.last_activity_at as string)
      : null,
    } satisfies AdminAccount;
  });
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const rows = (await db.execute(sql`
    SELECT
      u.id, u.email, u.created_at,
      -- Sessions stand in for Supabase's last_sign_in_at. A migrated user
      -- who has not signed in since the auth move has no sessions yet and
      -- reads as "never", which is the truth about the new system.
      (SELECT max(s.created_at) FROM sessions s
        WHERE s.user_id = u.id)            AS last_sign_in_at,
      COALESCE(
        (SELECT array_agg(DISTINCT a.provider_id)
           FROM accounts a WHERE a.user_id = u.id),
        '{}'
      )                                    AS providers,
      (SELECT o.name FROM memberships m
         JOIN organizations o ON o.id = m.org_id
        WHERE m.user_id = u.id ORDER BY m.created_at LIMIT 1) AS team_name,
      (SELECT m.role FROM memberships m
        WHERE m.user_id = u.id ORDER BY m.created_at LIMIT 1) AS role
    FROM users u
    ORDER BY u.created_at DESC
  `)) as unknown as Record<string, unknown>[];

  return rows.map((r) => ({
    id: String(r.id),
    email: (r.email as string) ?? null,
    providers: (r.providers as string[]) ?? [],
    createdAt: new Date(r.created_at as string),
    lastSignInAt: r.last_sign_in_at
      ? new Date(r.last_sign_in_at as string)
      : null,
    teamName: (r.team_name as string) ?? null,
    role: (r.role as string) ?? null,
  }));
}

/**
 * What people have told us is broken, newest first.
 *
 * Unread ones come first regardless of age, because the point of the
 * list is what still needs answering, not a chronology.
 */
export async function getAdminReports(limit = 50): Promise<AdminReport[]> {
  const rows = (await db.execute(sql`
    SELECT r.id, r.kind, r.message, r.email, r.page_url, r.user_agent,
           r.status, r.created_at, o.name AS org_name
    FROM problem_reports r
    LEFT JOIN organizations o ON o.id = r.org_id
    ORDER BY (r.status = 'new') DESC, r.created_at DESC
    LIMIT ${limit}
  `)) as unknown as Record<string, unknown>[];

  return rows.map((r) => ({
    id: String(r.id),
    kind: r.kind as AdminReport["kind"],
    message: String(r.message),
    email: r.email ? String(r.email) : null,
    orgName: r.org_name ? String(r.org_name) : null,
    pageUrl: r.page_url ? String(r.page_url) : null,
    userAgent: r.user_agent ? String(r.user_agent) : null,
    status: r.status as AdminReport["status"],
    createdAt: new Date(String(r.created_at)),
  }));
}

export type AdminWeek = {
  /** Monday of the ISO week the counts fall in. */
  week: Date;
  users: number;
  teams: number;
  realLeads: number;
};

export type AdminTrends = {
  /** Twelve weeks ending with the current one, zero-filled. */
  weeks: AdminWeek[];
  teams7d: number;
  realLeads7d: number;
  /** Users who belong to at least one team. Funnel step two. */
  usersWithTeam: number;
  /** Teams whose latest subscription still carries a live status. */
  payingTeams: number;
  /** The activation rate a week ago, so the tile can say which way it moved. */
  activatedTeams7dAgo: number;
  teams7dAgo: number;
};

/**
 * Direction, where the metrics above are position.
 *
 * Twelve weeks of signups, teams and real deals in week buckets, zero-filled
 * from generate_series so a quiet week shows as a gap rather than vanishing.
 * The 7-days-ago pair exists for one sentence on the Activated tile: the
 * rate falls when new teams arrive faster than they activate, and without
 * the comparison that reads as something breaking.
 */
export async function getAdminTrends(): Promise<AdminTrends> {
  const [weekRows, scalarRows] = await Promise.all([
    db.execute(sql`
      WITH weeks AS (
        SELECT generate_series(
          date_trunc('week', now()) - interval '11 weeks',
          date_trunc('week', now()),
          interval '1 week'
        ) AS w
      )
      SELECT
        weeks.w AS week,
        (SELECT count(*) FROM users u
          WHERE date_trunc('week', u.created_at) = weeks.w)::int AS users,
        (SELECT count(*) FROM organizations o
          WHERE date_trunc('week', o.created_at) = weeks.w)::int AS teams,
        (SELECT count(*) FROM leads l
          WHERE l.is_sample = false
            AND date_trunc('week', l.created_at) = weeks.w)::int AS real_leads
      FROM weeks
      ORDER BY weeks.w
    `) as unknown as Promise<Record<string, unknown>[]>,
    db.execute(sql`
      SELECT
        (SELECT count(*) FROM organizations
          WHERE created_at > now() - interval '7 days')::int AS teams_7d,
        (SELECT count(*) FROM leads
          WHERE is_sample = false
            AND created_at > now() - interval '7 days')::int AS real_leads_7d,
        (SELECT count(DISTINCT m.user_id) FROM memberships m)::int
          AS users_with_team,
        (SELECT count(DISTINCT s.org_id) FROM subscriptions s
          WHERE s.status IN ('active', 'trialing', 'past_due'))::int
          AS paying_teams,
        (SELECT count(DISTINCT org_id) FROM leads
          WHERE is_sample = false
            AND created_at < now() - interval '7 days')::int
          AS activated_7d_ago,
        (SELECT count(*) FROM organizations
          WHERE created_at < now() - interval '7 days')::int AS teams_7d_ago
    `) as unknown as Promise<Record<string, unknown>[]>,
  ]);

  const s = scalarRows[0];
  return {
    weeks: weekRows.map((r) => ({
      week: new Date(String(r.week)),
      users: Number(r.users),
      teams: Number(r.teams),
      realLeads: Number(r.real_leads),
    })),
    teams7d: Number(s.teams_7d),
    realLeads7d: Number(s.real_leads_7d),
    usersWithTeam: Number(s.users_with_team),
    payingTeams: Number(s.paying_teams),
    activatedTeams7dAgo: Number(s.activated_7d_ago),
    teams7dAgo: Number(s.teams_7d_ago),
  };
}

export type AdminPromoCode = {
  id: string;
  code: string;
  name: string;
  kind: "percent" | "amount" | "free_days";
  value: number;
  maxRedemptions: number | null;
  redemptions: number;
  expiresAt: Date | null;
  archived: boolean;
  createdAt: Date;
};

/** Every promo code, live first, with how often each has been used. */
export async function getAdminPromoCodes(): Promise<AdminPromoCode[]> {
  const rows = (await db.execute(sql`
    SELECT p.id, p.code, p.name, p.kind, p.value, p.max_redemptions,
           p.expires_at, p.archived_at, p.created_at,
           (SELECT count(*) FROM promo_redemptions r
             WHERE r.code_id = p.id)::int AS redemptions
    FROM promo_codes p
    ORDER BY (p.archived_at IS NULL) DESC, p.created_at DESC
  `)) as unknown as Record<string, unknown>[];

  return rows.map((r) => ({
    id: String(r.id),
    code: String(r.code),
    name: String(r.name),
    kind: r.kind as AdminPromoCode["kind"],
    value: Number(r.value),
    maxRedemptions:
      r.max_redemptions === null ? null : Number(r.max_redemptions),
    redemptions: Number(r.redemptions),
    expiresAt: r.expires_at ? new Date(String(r.expires_at)) : null,
    archived: Boolean(r.archived_at),
    createdAt: new Date(String(r.created_at)),
  }));
}

export type AdminUatFinding = {
  id: string;
  tried: boolean;
  note: string | null;
  severity: string | null;
  /** Seconds, for a timed check. Absent on runs before Beta 1.1. */
  measurement?: number | null;
  /** uat_attachments ids for this check's screenshots. */
  attachments?: string[];
};

export type AdminUatReport = {
  id: string;
  testerName: string;
  testerEmail: string;
  /**
   * The personal link the run came through, for grouping a tester's
   * submissions under one heading. Null for a run sent from the
   * anonymous /uat page before personal links existed.
   */
  testerToken: string | null;
  /** Which punch list the run was against, e.g. "Beta 1.0". */
  listVersion: string | null;
  findings: AdminUatFinding[];
  triedCount: number;
  totalCount: number;
  createdAt: Date;
};

/** Submissions from the hidden /uat tester page, newest first. */
export async function getAdminUatReports(): Promise<AdminUatReport[]> {
  const rows = (await db.execute(sql`
    SELECT r.id, r.tester_name, r.tester_email, r.list_version, r.findings,
           r.tried_count, r.total_count, r.created_at, t.token AS tester_token
    FROM uat_reports r
    LEFT JOIN uat_testers t ON t.id = r.tester_id
    ORDER BY r.created_at DESC
    LIMIT 50
  `)) as unknown as Record<string, unknown>[];

  return rows.map((r) => ({
    id: String(r.id),
    testerName: String(r.tester_name),
    testerEmail: String(r.tester_email),
    testerToken: r.tester_token ? String(r.tester_token) : null,
    listVersion: r.list_version ? String(r.list_version) : null,
    findings: (Array.isArray(r.findings) ? r.findings : []) as AdminUatFinding[],
    triedCount: Number(r.tried_count),
    totalCount: Number(r.total_count),
    createdAt: new Date(String(r.created_at)),
  }));
}

export type AdminBacklogItem = {
  id: string;
  /** Global sequence number behind the human ref, e.g. the 7 in BT-7. */
  seq: number;
  checkId: string;
  testerName: string;
  note: string;
  severity: string | null;
  /** uat_attachments ids: the tester's screenshots of this finding. */
  attachments: string[];
  scope: import("@/db/schema").BacklogScope | null;
  scopeStatus: "pending" | "scoped" | "failed";
  status: "new" | "approved" | "rejected" | "done";
  createdAt: Date;
};

/**
 * The reviewable backlog distilled from tester findings: needs-a-decision
 * first, then approved work, then the archive. Within each band, newest
 * first.
 */
export async function getAdminBacklog(): Promise<AdminBacklogItem[]> {
  const rows = (await db.execute(sql`
    SELECT id, seq, check_id, tester_name, note, severity, attachments, scope,
           scope_status, status, created_at
    FROM backlog_items
    ORDER BY (status = 'new') DESC, (status = 'approved') DESC,
             created_at DESC
    LIMIT 200
  `)) as unknown as Record<string, unknown>[];

  return rows.map((r) => ({
    id: String(r.id),
    seq: Number(r.seq),
    checkId: String(r.check_id),
    testerName: String(r.tester_name),
    note: String(r.note),
    severity: r.severity ? String(r.severity) : null,
    attachments: Array.isArray(r.attachments)
      ? (r.attachments as string[])
      : [],
    scope: (r.scope ?? null) as AdminBacklogItem["scope"],
    scopeStatus: r.scope_status as AdminBacklogItem["scopeStatus"],
    status: r.status as AdminBacklogItem["status"],
    createdAt: new Date(String(r.created_at)),
  }));
}

/**
 * How many backlog items await a decision. The back office proper only
 * needs the number for its Testing button; the items themselves live on
 * /admin/testing.
 */
export async function getBacklogNewCount(): Promise<number> {
  const rows = (await db.execute(sql`
    SELECT count(*)::int AS n FROM backlog_items WHERE status = 'new'
  `)) as unknown as Record<string, number>[];
  return Number(rows[0].n);
}

export type AdminUatTester = {
  id: string;
  token: string;
  name: string;
  email: string;
  /** How many checks their saved draft has ticked, for a glance at progress. */
  draftTried: number;
  draftUpdatedAt: Date | null;
  reports: number;
  createdAt: Date;
  /** Which list they are on: the full punch list, or a generated retest. */
  round: number;
  focusCount: number;
  /** Their bugs that are fixed and waiting to be re-checked. */
  retestReady: number;
  /** Their bugs still open, so a retest would waste their evening. */
  stillOpen: number;
};

/** Personal tester links, most recently active first. */
export async function getAdminUatTesters(): Promise<AdminUatTester[]> {
  const rows = (await db.execute(sql`
    SELECT t.id, t.token, t.name, t.email, t.draft, t.draft_updated_at,
           t.created_at,
           t.round, t.focus, t.retest_at,
           (SELECT count(*) FROM uat_reports r
             WHERE r.tester_id = t.id)::int AS reports,
           (SELECT count(DISTINCT b.check_id) FROM uat_reports r
              JOIN backlog_items b ON b.report_id = r.id
             WHERE r.tester_id = t.id AND b.status = 'done'
               AND b.updated_at > COALESCE(t.retest_at, 'epoch'::timestamptz)
               -- Only when nothing about that check is still open. See the
               -- note in lib/uat-retest.ts.
               AND NOT EXISTS (
                 SELECT 1 FROM uat_reports r2
                   JOIN backlog_items b2 ON b2.report_id = r2.id
                  WHERE r2.tester_id = t.id AND b2.check_id = b.check_id
                    AND b2.status <> 'done')
           )::int AS retest_ready,
           (SELECT count(*) FROM uat_reports r
              JOIN backlog_items b ON b.report_id = r.id
             WHERE r.tester_id = t.id AND b.status <> 'done')::int AS still_open
    FROM uat_testers t
    ORDER BY t.draft_updated_at DESC NULLS LAST, t.created_at DESC
  `)) as unknown as Record<string, unknown>[];

  return rows.map((r) => {
    const draft = (r.draft ?? {}) as Record<string, { tried?: boolean }>;
    return {
      id: String(r.id),
      token: String(r.token),
      name: String(r.name),
      email: String(r.email),
      draftTried: Object.values(draft).filter((i) => i?.tried === true).length,
      draftUpdatedAt: r.draft_updated_at
        ? new Date(String(r.draft_updated_at))
        : null,
      reports: Number(r.reports),
      createdAt: new Date(String(r.created_at)),
      round: Number(r.round ?? 0),
      focusCount: Array.isArray(r.focus) ? r.focus.length : 0,
      retestReady: Number(r.retest_ready ?? 0),
      stillOpen: Number(r.still_open ?? 0),
    };
  });
}

export type AdminReview = {
  id: string;
  rating: number;
  quote: string;
  name: string;
  company: string | null;
  orgName: string | null;
  consentPublic: boolean;
  status: "new" | "published" | "archived";
  source: string;
  createdAt: Date;
};

/** Every review, newest unhandled first. */
export async function getAdminReviews(): Promise<AdminReview[]> {
  const rows = (await db.execute(sql`
    SELECT r.id, r.rating, r.quote, r.name, r.company, r.consent_public,
           r.status, r.source, r.created_at, o.name AS org_name
    FROM reviews r
    LEFT JOIN organizations o ON o.id = r.org_id
    ORDER BY (r.status = 'new') DESC, r.created_at DESC
  `)) as unknown as Record<string, unknown>[];

  return rows.map((r) => ({
    id: String(r.id),
    rating: Number(r.rating),
    quote: String(r.quote),
    name: String(r.name),
    company: r.company ? String(r.company) : null,
    orgName: r.org_name ? String(r.org_name) : null,
    consentPublic: Boolean(r.consent_public),
    status: r.status as AdminReview["status"],
    source: String(r.source),
    createdAt: new Date(String(r.created_at)),
  }));
}
