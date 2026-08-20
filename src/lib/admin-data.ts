import { sql } from "drizzle-orm";
import { db } from "@/db";

export type AdminAccount = {
  orgId: string;
  name: string;
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
      (SELECT count(*) FROM auth.users)::int AS users,
      (SELECT count(*) FROM organizations)::int AS teams,
      (SELECT count(*) FROM auth.users
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

export async function getAdminAccounts(): Promise<AdminAccount[]> {
  const rows = (await db.execute(sql`
    SELECT
      o.id                AS org_id,
      o.name              AS name,
      o.created_at        AS created_at,
      (SELECT u.email FROM memberships m
         JOIN auth.users u ON u.id = m.user_id
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
        WHERE a.org_id = o.id)                               AS last_activity_at
    FROM organizations o
    ORDER BY o.created_at DESC
  `)) as unknown as Record<string, unknown>[];

  return rows.map((r) => ({
    orgId: String(r.org_id),
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
  }));
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const rows = (await db.execute(sql`
    SELECT
      u.id, u.email, u.created_at, u.last_sign_in_at,
      COALESCE(
        (SELECT array_agg(i.provider ORDER BY i.created_at)
           FROM auth.identities i WHERE i.user_id = u.id),
        '{}'
      )                                    AS providers,
      (SELECT o.name FROM memberships m
         JOIN organizations o ON o.id = m.org_id
        WHERE m.user_id = u.id ORDER BY m.created_at LIMIT 1) AS team_name,
      (SELECT m.role FROM memberships m
        WHERE m.user_id = u.id ORDER BY m.created_at LIMIT 1) AS role
    FROM auth.users u
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
