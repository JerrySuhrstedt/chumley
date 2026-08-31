import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, ClipboardList } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { getAdminUatReport } from "@/lib/admin-data";
import { SECTIONS } from "@/app/uat/checks";

/**
 * One run, exactly as the tester left it: every check in punch-list
 * order, ticked or not, with their write-up, severity, seconds, and
 * screenshots. The grouped list answers "who has tested"; this page
 * answers "what did they actually see", which is what the owner needs
 * when comparing a tester's account against their own.
 */
export const metadata: Metadata = {
  title: "Tester run | Chumley",
  robots: { index: false, follow: false },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function TesterRunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const report = await getAdminUatReport(id);
  if (!report) notFound();

  const byId = new Map(report.findings.map((f) => [f.id, f]));
  // A retest run only carries the checks it asked about; sections with
  // nothing answered are dropped rather than shown as a wall of blanks.
  const sections = SECTIONS.map((s) => ({
    ...s,
    checks: s.checks.filter((c) => byId.has(c.id)),
  })).filter((s) => s.checks.length > 0);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex items-start gap-2">
          <ClipboardList className="mt-0.5 size-5 text-slate-500" />
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              {report.testerName}&apos;s run
            </h1>
            <p className="text-sm text-slate-500">
              {report.testerEmail} · {report.listVersion ?? "unversioned"} ·{" "}
              {report.createdAt.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}{" "}
              · {report.triedCount} of {report.totalCount} tried
            </p>
          </div>
          <Link
            href="/admin/testing"
            className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="size-3.5" />
            Testing
          </Link>
        </div>

        {sections.map((section) => (
          <section key={section.key}>
            <h2 className="mb-2 text-sm font-semibold text-slate-900">
              {section.title}
            </h2>
            <ul className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
              {section.checks.map((check) => {
                const f = byId.get(check.id)!;
                return (
                  <li
                    key={check.id}
                    className="flex items-start gap-3 border-t border-slate-100 px-4 py-3 first:border-t-0"
                  >
                    <span
                      className={`mt-0.5 grid size-5 shrink-0 place-content-center rounded border-2 ${
                        f.tried
                          ? "border-green-700 bg-green-700 text-white"
                          : "border-slate-300 bg-white text-transparent"
                      }`}
                    >
                      <Check className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium ${
                          f.tried ? "text-slate-900" : "text-slate-400"
                        }`}
                      >
                        <span className="mr-2 font-mono text-xs text-[var(--brand)]">
                          {check.id}
                        </span>
                        {check.what}
                        {f.severity && (
                          <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                            {f.severity}
                          </span>
                        )}
                        {f.measurement != null && (
                          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">
                            {f.measurement}s
                          </span>
                        )}
                      </p>
                      {f.note && (
                        <p className="mt-1.5 border-l-2 border-slate-200 pl-3 text-sm whitespace-pre-wrap text-slate-600">
                          {f.note}
                        </p>
                      )}
                      {f.attachments && f.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
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
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
