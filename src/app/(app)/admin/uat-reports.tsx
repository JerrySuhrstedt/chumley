import Link from "next/link";
import type { AdminUatReport } from "@/lib/admin-data";
import { ALL_CHECKS } from "@/app/uat/checks";

const titleById = new Map(ALL_CHECKS.map((c) => [c.id, c.what]));

/**
 * Test runs from the hidden /uat page, grouped by tester: one heading
 * per person carrying their test link, their runs stacked under it,
 * newest first. A tester is encouraged to send more than once, so
 * per-submission cards scattered one person across the page. Issues
 * first within a run, because the notes are the entire point; the
 * tried-count is just how far they got.
 */
export function UatReports({
  items,
  origin,
}: {
  items: AdminUatReport[];
  origin: string;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
        Nothing yet. Send a tester to chumley.app/uat and their runs land
        here.
      </p>
    );
  }

  // Keyed by the personal link where there is one, by email where a run
  // predates links. items arrive newest-first, so groups keep that order
  // both between and within themselves.
  const groups = new Map<string, AdminUatReport[]>();
  for (const report of items) {
    const key = report.testerToken ?? report.testerEmail.toLowerCase();
    const list = groups.get(key);
    if (list) list.push(report);
    else groups.set(key, [report]);
  }

  return (
    <div className="flex flex-col gap-3">
      {[...groups.values()].map((runs) => {
        const head = runs[0];
        const issueTotal = runs.reduce(
          (n, r) => n + r.findings.filter((f) => f.note).length,
          0
        );
        return (
          <div
            key={head.testerToken ?? head.testerEmail}
            className="rounded-lg border border-slate-200 bg-white"
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-slate-100 px-4 py-3">
              <span className="font-semibold text-slate-900">
                {head.testerName}
              </span>
              <span className="text-xs text-slate-500">
                {head.testerEmail}
              </span>
              {head.testerToken && (
                <a
                  href={`${origin}/uat/${head.testerToken}`}
                  target="_blank"
                  rel="noopener"
                  className="font-mono text-[11px] text-[var(--brand)] hover:underline"
                >
                  /uat/{head.testerToken}
                </a>
              )}
              <span className="ml-auto text-xs text-slate-500">
                {runs.length} {runs.length === 1 ? "run" : "runs"} ·{" "}
                {issueTotal} {issueTotal === 1 ? "issue" : "issues"}
              </span>
            </div>

            <div className="flex flex-col divide-y divide-slate-100">
              {runs.map((report) => {
                const issues = report.findings.filter((f) => f.note);
                // Timed checks report a number even when they pass; a
                // pass with no note would otherwise be invisible here.
                const timings = report.findings.filter(
                  (f) => f.measurement != null
                );
                return (
                  <div key={report.id} className="px-4 py-3">
                    <p className="flex flex-wrap items-baseline gap-x-3 text-xs text-slate-500">
                      <span>
                        {report.listVersion && `${report.listVersion} · `}
                        {report.createdAt.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        · {report.triedCount} of {report.totalCount} tried ·{" "}
                        {issues.length}{" "}
                        {issues.length === 1 ? "issue" : "issues"}
                      </span>
                      <Link
                        href={`/admin/testing/runs/${report.id}`}
                        className="font-semibold text-[var(--brand)] hover:underline"
                      >
                        View the full form
                      </Link>
                    </p>

                    {timings.length > 0 && (
                      <p className="mt-2 flex flex-wrap gap-1.5">
                        {timings.map((f) => (
                          <span
                            key={f.id}
                            className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700"
                          >
                            {f.id} · {f.measurement}s
                          </span>
                        ))}
                      </p>
                    )}

                    {issues.length > 0 && (
                      <ul className="mt-3 flex flex-col gap-2.5">
                        {issues.map((f) => (
                          <li key={f.id} className="text-sm">
                            <p className="font-medium text-slate-900">
                              <span className="mr-2 font-mono text-xs text-[var(--brand)]">
                                {f.id}
                              </span>
                              {titleById.get(f.id) ?? "Unknown check"}
                              {f.severity && (
                                <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                                  {f.severity}
                                </span>
                              )}
                            </p>
                            <p className="mt-0.5 whitespace-pre-wrap text-slate-600">
                              {f.note}
                            </p>
                            {f.attachments && f.attachments.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-2">
                                {f.attachments.map((a) => (
                                  <a
                                    key={a}
                                    href={`/api/uat/attachments/${a}`}
                                    target="_blank"
                                    rel="noopener"
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element -- tester upload served from our own route */}
                                    <img
                                      src={`/api/uat/attachments/${a}`}
                                      alt="Tester screenshot"
                                      className="h-20 w-20 rounded-md border border-slate-200 object-cover"
                                    />
                                  </a>
                                ))}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
