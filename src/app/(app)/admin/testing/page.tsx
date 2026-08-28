import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { Backlog } from "../backlog";
import { Testers } from "../testers";
import { UatReports } from "../uat-reports";
import { requireAdmin } from "@/lib/admin";
import { getOrigin } from "@/lib/site-url";
import {
  getAdminBacklog,
  getAdminUatReports,
  getAdminUatTesters,
} from "@/lib/admin-data";

/**
 * Everything about testing on one page, so the back office proper stays
 * about running the business. Backlog first because it is the section
 * with decisions in it; links and raw runs are reference material.
 */
export const metadata: Metadata = {
  title: "Testing | Chumley",
  robots: { index: false, follow: false },
};

export default async function TestingPage() {
  await requireAdmin();

  const [backlog, testers, uatReports, origin] = await Promise.all([
    getAdminBacklog(),
    getAdminUatTesters(),
    getAdminUatReports(),
    getOrigin(),
  ]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex items-center gap-2">
          <FlaskConical className="size-5 text-slate-500" />
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Testing</h1>
            <p className="text-sm text-slate-500">
              Tester links, their submitted runs, and the backlog Claude
              scoped from them.
            </p>
          </div>
          <Link
            href="/admin"
            className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="size-3.5" />
            Back office
          </Link>
        </div>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-900">
            Backlog ({backlog.filter((b) => b.status === "new").length} to
            review)
          </h2>
          <p className="mb-3 text-xs text-slate-500">
            Every issue a tester wrote up, scoped by Claude into a proposed
            fix. Approve the ones worth doing; a Claude Code session picks up
            the approved list from here.
          </p>
          <Backlog items={backlog} />
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-900">
            Testers ({testers.length})
          </h2>
          <p className="mb-3 text-xs text-slate-500">
            Personal punch-list links. A tester&apos;s progress follows the
            link, so the same URL works on their laptop and their phone.
          </p>
          <Testers testers={testers} origin={origin} />
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-900">
            Tester runs ({uatReports.length})
          </h2>
          <p className="mb-3 text-xs text-slate-500">
            Submissions from the hidden punch list at /uat. Issues shown in
            full; ticked checks are counted only.
          </p>
          <UatReports items={uatReports} />
        </section>
      </div>
    </div>
  );
}
