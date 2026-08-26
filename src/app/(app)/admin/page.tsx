import type { Metadata } from "next";
import { CreditCard, ShieldCheck } from "lucide-react";
import { AccountControls } from "./account-controls";
import { StatusPill } from "./status-pill";
import { Giveaway } from "./giveaway";
import { EnvLine } from "./env-line";
import { Reports } from "./reports";
import { PromoCodes } from "./promo-codes";
import { Sparkline, Delta, WeeklyGrowth, Funnel } from "./charts";
import { requireAdmin } from "@/lib/admin";
import {
  getAdminAccounts,
  getAdminMetrics,
  getAdminPromoCodes,
  getAdminReports,
  getAdminTrends,
  getAdminUsers,
} from "@/lib/admin-data";

export const metadata: Metadata = {
  title: "Back office | Chumley",
  robots: { index: false, follow: false },
};

const date = (d: Date | null) =>
  d ? d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—";

function ago(d: Date | null) {
  if (!d) return "never";
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

function Stat({
  label,
  value,
  note,
  alert = false,
  delta,
  spark,
}: {
  label: string;
  value: string;
  note?: string;
  /** Draws the eye when the number is one that needs acting on. */
  alert?: boolean;
  /** Which way the number moved this week, rendered as a chip. */
  delta?: React.ReactNode;
  /** Twelve weekly values, rendered as a line under the number. */
  spark?: number[];
}) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-sm ${
        alert
          ? "border-[var(--brand)]/40 bg-[var(--brand-tint)]"
          : "border-slate-200 bg-white"
      }`}
    >
      <p
        className={`text-[10.5px] font-semibold tracking-wider uppercase ${
          alert ? "text-[var(--brand)]" : "text-slate-500"
        }`}
      >
        {label}
      </p>
      <div className="mt-0.5 flex items-end justify-between gap-2">
        <p
          className={`text-2xl font-bold tabular-nums ${
            alert ? "text-[var(--brand)]" : "text-slate-900"
          }`}
        >
          {value}
        </p>
        {delta}
      </div>
      {spark && <Sparkline points={spark} />}
      {note && <p className="mt-0.5 text-xs text-slate-400">{note}</p>}
    </div>
  );
}

export default async function AdminPage() {
  // Gate first, before a single row is read.
  await requireAdmin();

  const [metrics, accounts, users, reports, trends, promoCodes] =
    await Promise.all([
      getAdminMetrics(),
      getAdminAccounts(),
      getAdminUsers(),
      getAdminReports(),
      getAdminTrends(),
      getAdminPromoCodes(),
    ]);

  const activation = metrics.teams
    ? Math.round((metrics.activatedTeams / metrics.teams) * 100)
    : 0;
  const activationWasPct = trends.teams7dAgo
    ? Math.round((trends.activatedTeams7dAgo / trends.teams7dAgo) * 100)
    : null;
  const trialTeams = accounts.filter(
    (a) => a.status === "trial" || a.status === "trialing"
  ).length;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-slate-500" />
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Back office</h1>
            <p className="text-sm text-slate-500">
              Every account on Chumley. Visible only to listed administrators.
            </p>
          </div>
        </div>

        <EnvLine />

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat
            label="New reports"
            value={String(metrics.newReports)}
            note={metrics.newReports > 0 ? "waiting on you" : "nothing waiting"}
            alert={metrics.newReports > 0}
          />
          <Stat
            label="Users"
            value={String(metrics.users)}
            delta={
              <Delta
                value={`+${metrics.newUsers7d}`}
                direction={metrics.newUsers7d > 0 ? "up" : "flat"}
              />
            }
            spark={trends.weeks.map((w) => w.users)}
          />
          <Stat
            label="Teams"
            value={String(metrics.teams)}
            delta={
              <Delta
                value={`+${trends.teams7d}`}
                direction={trends.teams7d > 0 ? "up" : "flat"}
              />
            }
            spark={trends.weeks.map((w) => w.teams)}
          />
          <Stat
            label="New this week"
            value={String(metrics.newUsers7d)}
            note="signups, 7 days"
          />
          <Stat
            label="Activated"
            value={`${activation}%`}
            note={`${metrics.activatedTeams} of ${metrics.teams} added a real deal`}
            delta={
              activationWasPct !== null && activationWasPct !== activation ? (
                <Delta
                  value={`was ${activationWasPct}%`}
                  suffix=""
                  direction={activation > activationWasPct ? "up" : "down"}
                />
              ) : undefined
            }
          />
          <Stat
            label="Real deals"
            value={metrics.realLeads.toLocaleString()}
            note="samples excluded"
            delta={
              <Delta
                value={`+${trends.realLeads7d}`}
                direction={trends.realLeads7d > 0 ? "up" : "flat"}
              />
            }
            spark={trends.weeks.map((w) => w.realLeads)}
          />
          <Stat
            label="Paying teams"
            value={String(trends.payingTeams)}
            note={
              trends.payingTeams === 0
                ? trialTeams > 0
                  ? `none yet, ${trialTeams} in trial`
                  : "none yet"
                : "live subscriptions"
            }
          />
          <Stat
            label="Logged actions"
            value={metrics.activities.toLocaleString()}
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
          <WeeklyGrowth weeks={trends.weeks} />
          <Funnel
            steps={[
              { label: "Signed up", count: metrics.users, drop: "" },
              {
                label: "Created or joined a team",
                count: trends.usersWithTeam,
                drop:
                  metrics.users - trends.usersWithTeam > 0
                    ? `${metrics.users - trends.usersWithTeam} never made or joined one`
                    : "",
              },
              {
                label: "Added a real deal",
                count: metrics.activatedTeams,
                drop:
                  metrics.teams - metrics.activatedTeams > 0
                    ? `${metrics.teams - metrics.activatedTeams} teams still on samples only`
                    : "",
              },
              {
                label: "Paying",
                count: trends.payingTeams,
                drop:
                  trends.payingTeams === 0 && trialTeams > 0
                    ? `${trialTeams} trial${trialTeams === 1 ? "" : "s"} open`
                    : "",
              },
            ]}
          />
        </div>

        <PromoCodes codes={promoCodes} />

        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-900">
            Feedback ({reports.length})
          </h2>
          <p className="mb-3 text-xs text-slate-500">
            What people reported from inside the app, unread first.
          </p>
          <Reports reports={reports} />
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Accounts ({accounts.length})
            </h2>
            <Giveaway />
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[54rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  {[
                    "Team",
                    "Status",
                    "Last active",
                    "Owner",
                    "Members",
                    "Real deals",
                    "Contacts",
                    "Samples left",
                    "Actions",
                    "Joined",
                    "",
                  ].map((h) => (
                    <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((a) => (
                  <tr key={a.orgId} className="align-middle">
                    <td className="px-3 py-2 font-medium text-slate-900">
                      {a.name}
                      {/* The reason lives on the row, because a comped
                          account with no explanation is unreadable later. */}
                      {a.customPriceCents !== null && (
                        <span
                          title={a.customPriceReason ?? undefined}
                          className="mt-0.5 block text-[11px] font-semibold text-[var(--brand-dark)]"
                        >
                          ${(a.customPriceCents / 100).toFixed(2)}/seat/mo
                        </span>
                      )}
                      {a.comped && a.compedReason && (
                        <span
                          title={a.compedReason}
                          className="mt-0.5 block max-w-44 truncate text-[11px] font-normal text-orange-700"
                        >
                          {a.compedReason}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <StatusPill
                        status={a.status}
                        endsAt={a.endsAt}
                        seats={a.seats}
                        compedUntil={a.compedUntil}
                        trialDaysLeft={a.trialDaysLeft}
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={
                          a.lastActivityAt ? "text-slate-600" : "font-semibold text-red-600"
                        }
                      >
                        {ago(a.lastActivityAt)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-600">{a.ownerEmail ?? "—"}</td>
                    <td className="px-3 py-2 text-slate-600 tabular-nums">{a.members}</td>
                    <td className="px-3 py-2 tabular-nums">
                      <span
                        className={
                          a.realLeads > 0
                            ? "font-semibold text-slate-900"
                            : "text-slate-400"
                        }
                      >
                        {a.realLeads}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-600 tabular-nums">
                      {a.contacts.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-slate-600 tabular-nums">{a.sampleLeads}</td>
                    <td className="px-3 py-2 text-slate-600 tabular-nums">{a.activities}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-600">
                      {date(a.createdAt)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <AccountControls account={a} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-900">
            Users ({users.length})
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  {["Email", "Signs in with", "Team", "Role", "Joined", "Last seen"].map(
                    (h) => (
                      <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-3 py-2 font-medium text-slate-900">
                      {u.email ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <span className="flex flex-wrap gap-1">
                        {u.providers.map((p) => (
                          <span
                            key={p}
                            className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700"
                          >
                            {p === "linkedin_oidc" ? "linkedin" : p}
                          </span>
                        ))}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-600">{u.teamName ?? "—"}</td>
                    <td className="px-3 py-2 text-slate-600">{u.role ?? "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-600">
                      {date(u.createdAt)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-600">
                      {ago(u.lastSignInAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <BillingNote />
      </div>
    </div>
  );
}

/**
 * Which Paddle this deployment charges through, in prose.
 *
 * Rendered from PADDLE_ENV rather than written by hand, because the
 * hand-written version said "sandbox" for a week after the flip to live
 * while the strip at the top said the opposite. A page that can disagree
 * with itself about money is worse than no page.
 */
function BillingNote() {
  const live = process.env.PADDLE_ENV === "production";
  return (
    <section className="rounded-xl border border-dashed border-slate-300 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <CreditCard className="mt-0.5 size-5 shrink-0 text-slate-400" />
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Billing ·{" "}
            <span className={live ? "text-emerald-700" : "text-amber-700"}>
              {live ? "live" : "sandbox"}
            </span>
          </h2>
          {live ? (
            <p className="mt-1 max-w-[70ch] text-sm text-slate-600">
              Paddle is connected in{" "}
              <strong className="font-semibold text-slate-900">production</strong>.
              Real cards charge real money. Status per team is in the column
              above, read from the subscription mirrored back by the webhook
              rather than asked of Paddle on every page load.
            </p>
          ) : (
            <>
              <p className="mt-1 max-w-[70ch] text-sm text-slate-600">
                Paddle is connected in{" "}
                <strong className="font-semibold text-slate-900">sandbox</strong>.
                Nothing charges a real card, and the test number 4242 4242 4242
                4242 is the only one that works. Status per team is in the
                column above, read from the subscription mirrored back by the
                webhook rather than asked of Paddle on every page load.
              </p>
              <p className="mt-2 max-w-[70ch] text-sm text-slate-600">
                Going live means three things: flip PADDLE_ENV and
                NEXT_PUBLIC_PADDLE_ENV to production, run the catalog seed
                against live to get real price ids, and get chumley.app
                approved by Paddle. The test-card notice on the pricing page
                disappears by itself the moment that first variable changes.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
