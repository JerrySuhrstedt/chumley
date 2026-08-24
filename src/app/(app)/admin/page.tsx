import type { Metadata } from "next";
import { CreditCard, ShieldCheck } from "lucide-react";
import { AccountControls } from "./account-controls";
import { StatusPill } from "./status-pill";
import { Giveaway } from "./giveaway";
import { Reports } from "./reports";
import { requireAdmin } from "@/lib/admin";
import {
  getAdminAccounts,
  getAdminMetrics,
  getAdminReports,
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
}: {
  label: string;
  value: string;
  note?: string;
  /** Draws the eye when the number is one that needs acting on. */
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        alert
          ? "border-[var(--brand)]/40 bg-[var(--brand-tint)]"
          : "border-slate-200 bg-white"
      }`}
    >
      <p
        className={`text-2xl font-bold ${alert ? "text-[var(--brand)]" : "text-slate-900"}`}
      >
        {value}
      </p>
      <p className="text-xs font-medium text-slate-600">{label}</p>
      {note && <p className="mt-0.5 text-xs text-slate-400">{note}</p>}
    </div>
  );
}

export default async function AdminPage() {
  // Gate first, before a single row is read.
  await requireAdmin();

  const [metrics, accounts, users, reports] = await Promise.all([
    getAdminMetrics(),
    getAdminAccounts(),
    getAdminUsers(),
    getAdminReports(),
  ]);

  const activation = metrics.teams
    ? Math.round((metrics.activatedTeams / metrics.teams) * 100)
    : 0;

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

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Stat
            label="New reports"
            value={String(metrics.newReports)}
            note={metrics.newReports > 0 ? "waiting on you" : "nothing waiting"}
            alert={metrics.newReports > 0}
          />
          <Stat label="Users" value={String(metrics.users)} />
          <Stat label="Teams" value={String(metrics.teams)} />
          <Stat
            label="New this week"
            value={String(metrics.newUsers7d)}
            note="signups, 7 days"
          />
          <Stat
            label="Activated"
            value={`${activation}%`}
            note={`${metrics.activatedTeams} of ${metrics.teams} added a real deal`}
          />
          <Stat
            label="Real deals"
            value={metrics.realLeads.toLocaleString()}
            note="samples excluded"
          />
          <Stat label="Logged actions" value={metrics.activities.toLocaleString()} />
        </div>

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
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full min-w-[54rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  {[
                    "Team",
                    "Status",
                    "Owner",
                    "Members",
                    "Real deals",
                    "Contacts",
                    "Samples left",
                    "Actions",
                    "Joined",
                    "Last active",
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
                      {a.comped && a.compedReason && (
                        <span
                          title={a.compedReason}
                          className="mt-0.5 block max-w-44 truncate text-[11px] font-normal text-violet-700"
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
                      />
                    </td>
                    <td className="px-3 py-2 text-slate-600">{a.ownerEmail ?? "—"}</td>
                    <td className="px-3 py-2 text-slate-600">{a.members}</td>
                    <td className="px-3 py-2">
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
                    <td className="px-3 py-2 text-slate-600">
                      {a.contacts.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{a.sampleLeads}</td>
                    <td className="px-3 py-2 text-slate-600">{a.activities}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-600">
                      {date(a.createdAt)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={
                          a.lastActivityAt ? "text-slate-600" : "text-red-600"
                        }
                      >
                        {ago(a.lastActivityAt)}
                      </span>
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
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
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

        <section className="rounded-lg border border-dashed border-slate-300 bg-white p-5">
          <div className="flex items-start gap-3">
            <CreditCard className="mt-0.5 size-5 shrink-0 text-slate-400" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Billing
              </h2>
              <p className="mt-1 max-w-[70ch] text-sm text-slate-600">
                Paddle is connected in{" "}
                <strong className="font-semibold text-slate-900">
                  sandbox
                </strong>
                . Nothing charges a real card, and the test number 4242 4242
                4242 4242 is the only one that works. Status per team is in
                the column above, read from the subscription mirrored back by
                the webhook rather than asked of Paddle on every page load.
              </p>
              <p className="mt-2 max-w-[70ch] text-sm text-slate-600">
                Going live means three things: flip PADDLE_ENV and
                NEXT_PUBLIC_PADDLE_ENV to production, run the catalog seed
                against live to get real price ids, and get chumley.app
                approved by Paddle. The test-card notice on the pricing page
                disappears by itself the moment that first variable changes.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
