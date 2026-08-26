// Temporary check for the new getAdminTrends SQL. Safe to delete.
import { config } from "dotenv";
import postgres from "postgres";
config({ path: ".env.local" });
const sql = postgres(process.env.DATABASE_URL, { prepare: false });

const weeks = await sql`
  WITH weeks AS (
    SELECT generate_series(
      date_trunc('week', now()) - interval '11 weeks',
      date_trunc('week', now()),
      interval '1 week'
    ) AS w
  )
  SELECT
    weeks.w AS week,
    (SELECT count(*) FROM auth.users u
      WHERE date_trunc('week', u.created_at) = weeks.w)::int AS users,
    (SELECT count(*) FROM organizations o
      WHERE date_trunc('week', o.created_at) = weeks.w)::int AS teams,
    (SELECT count(*) FROM leads l
      WHERE l.is_sample = false
        AND date_trunc('week', l.created_at) = weeks.w)::int AS real_leads
  FROM weeks ORDER BY weeks.w`;
console.log("weeks:", weeks.map(r => `${String(r.week).slice(4,10)} u${r.users} t${r.teams} d${r.real_leads}`).join(" | "));

const s = await sql`
  SELECT
    (SELECT count(*) FROM organizations WHERE created_at > now() - interval '7 days')::int AS teams_7d,
    (SELECT count(*) FROM leads WHERE is_sample = false AND created_at > now() - interval '7 days')::int AS real_leads_7d,
    (SELECT count(DISTINCT m.user_id) FROM memberships m)::int AS users_with_team,
    (SELECT count(DISTINCT s.org_id) FROM subscriptions s WHERE s.status IN ('active','trialing','past_due'))::int AS paying_teams,
    (SELECT count(DISTINCT org_id) FROM leads WHERE is_sample = false AND created_at < now() - interval '7 days')::int AS activated_7d_ago,
    (SELECT count(*) FROM organizations WHERE created_at < now() - interval '7 days')::int AS teams_7d_ago`;
console.log("scalars:", JSON.stringify(s[0]));
await sql.end();
