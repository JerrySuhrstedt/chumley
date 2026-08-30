import type { AdminUatReport } from "@/lib/admin-data";
import { ALL_CHECKS } from "@/app/uat/checks";

const titleById = new Map(ALL_CHECKS.map((c) => [c.id, c.what]));

/**
 * Test runs from the hidden /uat page, one card per submission. Issues
 * first, because the notes are the entire point; the tried-count is just
 * how far they got.
 */
export function UatReports({ items }: { items: AdminUatReport[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
        Nothing yet. Send a tester to chumley.app/uat and their runs land
        here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((report) => {
        const issues = report.findings.filter((f) => f.note);
        // Timed checks report a number even when they pass; a pass with
        // no note would otherwise be invisible here.
        const timings = report.findings.filter((f) => f.measurement != null);
        return (
          <div
            key={report.id}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-semibold text-slate-900">
                {report.testerName}
              </span>
              <span className="text-xs text-slate-500">{report.testerEmail}</span>
              <span className="ml-auto text-xs text-slate-500">
                {report.listVersion && `${report.listVersion} · `}
                {report.createdAt.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}{" "}
                · {report.triedCount} of {report.totalCount} tried ·{" "}
                {issues.length} {issues.length === 1 ? "issue" : "issues"}
              </span>
            </div>

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
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
