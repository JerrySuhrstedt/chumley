"use client";

import { useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { Check, Inbox, Mail } from "lucide-react";
import type { AdminReport } from "@/lib/admin-data";
import { setReportStatus } from "../_report/actions";

/**
 * What people reported, unread first.
 *
 * The page and the browser are shown because they are usually what makes
 * a report actionable, and the email because the fastest useful response
 * is often a reply rather than a fix.
 */
/** Colour carries the kind, so a wall of reports can be skimmed. */
const KIND: Record<AdminReport["kind"], { label: string; className: string }> = {
  broke: { label: "Broke", className: "bg-red-100 text-red-800" },
  confusing: { label: "Confusing", className: "bg-amber-100 text-amber-900" },
  idea: { label: "Idea", className: "bg-indigo-100 text-indigo-800" },
  praise: { label: "Nice work", className: "bg-emerald-100 text-emerald-800" },
};

export function Reports({ reports }: { reports: AdminReport[] }) {
  const [busy, start] = useTransition();

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white p-8 text-center">
        <Inbox className="size-6 text-slate-300" />
        <p className="text-sm font-medium text-slate-700">
          Nobody has reported anything
        </p>
        <p className="max-w-[40ch] text-xs text-slate-500">
          Which is either very good news or a sign the button is too well
          hidden. Worth checking it works before assuming the former.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {reports.map((r) => (
        <li
          key={r.id}
          className={`rounded-lg border p-4 ${
            r.status === "new"
              ? "border-[var(--brand)]/40 bg-[var(--brand-tint)]"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span
                className={`mb-1.5 inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-bold tracking-wide uppercase ${KIND[r.kind].className}`}
              >
                {KIND[r.kind].label}
              </span>
              <p className="text-sm whitespace-pre-wrap text-slate-900">
                {r.message}
              </p>
            </div>
            {r.status !== "closed" && (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  start(async () => {
                    await setReportStatus(
                      r.id,
                      r.status === "new" ? "read" : "closed"
                    );
                  })
                }
                className="shrink-0 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                {r.status === "new" ? "Mark read" : "Close"}
              </button>
            )}
            {r.status === "closed" && (
              <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-700">
                <Check className="size-3.5" strokeWidth={3} />
                Closed
              </span>
            )}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>{formatDistanceToNow(r.createdAt, { addSuffix: true })}</span>
            {r.orgName && <span>· {r.orgName}</span>}
            {r.email && (
              <a
                href={`mailto:${r.email}?subject=${encodeURIComponent("About the problem you reported in Sell1")}`}
                className="inline-flex items-center gap-1 font-medium text-[var(--board-bg)] hover:underline"
              >
                <Mail className="size-3" />
                {r.email}
              </a>
            )}
            {r.pageUrl && (
              <span className="font-mono text-[11px]">{r.pageUrl}</span>
            )}
          </div>

          {r.userAgent && (
            <p className="mt-1 truncate font-mono text-[11px] text-slate-400">
              {r.userAgent}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
