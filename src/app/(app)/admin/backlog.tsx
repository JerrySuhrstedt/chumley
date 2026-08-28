"use client";

import { useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { ClipboardList, Loader2, RefreshCw } from "lucide-react";
import type { AdminBacklogItem } from "@/lib/admin-data";
import { ALL_CHECKS } from "@/app/uat/checks";
import { rescopeBacklogItem, setBacklogStatus } from "./uat-actions";

const titleById = new Map(ALL_CHECKS.map((c) => [c.id, c.what]));

const STATUS: Record<
  AdminBacklogItem["status"],
  { label: string; className: string }
> = {
  new: { label: "Needs review", className: "bg-amber-100 text-amber-900" },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Rejected", className: "bg-slate-100 text-slate-500" },
  done: { label: "Done", className: "bg-slate-900 text-white" },
};

const SIZE_LABEL: Record<string, string> = {
  S: "Small · under a day",
  M: "Medium · 1–3 days",
  L: "Large · a week or more",
};

/**
 * The two-step loop, step one: every scoped finding waits here for a
 * decision. Approve is the signal a Claude Code session works from, so
 * the card has to carry enough to decide without opening the code: the
 * tester's words, the proposed fix, the size, and the risk.
 */
export function Backlog({ items }: { items: AdminBacklogItem[] }) {
  const [busy, start] = useTransition();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white p-8 text-center">
        <ClipboardList className="size-6 text-slate-300" />
        <p className="text-sm font-medium text-slate-700">
          Nothing in the backlog
        </p>
        <p className="max-w-[44ch] text-xs text-slate-500">
          When a tester sends in a punch list, every issue they wrote up
          lands here with a proposed fix, ready for a yes or a no.
        </p>
      </div>
    );
  }

  const act = (fn: () => Promise<void>) => start(async () => void (await fn()));

  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => {
        const s = STATUS[item.status];
        const scope = item.scope;
        return (
          <li
            key={item.id}
            className={`rounded-lg border p-4 ${
              item.status === "new"
                ? "border-[var(--brand)]/40 bg-[var(--brand-tint)]"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span
                className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-bold tracking-wide uppercase ${s.className}`}
              >
                {s.label}
              </span>
              <span className="font-mono text-xs text-[var(--brand)]">
                {item.checkId}
              </span>
              {item.severity && (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                  {item.severity}
                </span>
              )}
              {scope?.size && (
                <span
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600"
                  title={SIZE_LABEL[scope.size]}
                >
                  {SIZE_LABEL[scope.size] ?? scope.size}
                </span>
              )}
              <span className="ml-auto text-xs text-slate-500">
                {item.testerName} ·{" "}
                {formatDistanceToNow(item.createdAt, { addSuffix: true })}
              </span>
            </div>

            <p className="mt-2 font-semibold text-slate-900">
              {scope?.summary ?? titleById.get(item.checkId) ?? item.checkId}
            </p>
            <p className="mt-1 border-l-2 border-slate-200 pl-3 text-sm whitespace-pre-wrap text-slate-600">
              {item.note}
            </p>

            {scope ? (
              <div className="mt-3 flex flex-col gap-2 rounded-md bg-slate-50 p-3 text-sm">
                <p className="text-slate-700">
                  <span className="mr-2 font-mono text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                    Likely cause
                  </span>
                  {scope.likelyCause}
                </p>
                <p className="text-slate-700">
                  <span className="mr-2 font-mono text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                    Proposed fix
                  </span>
                  {scope.proposedFix}
                </p>
                {scope.risk && (
                  <p className="text-slate-700">
                    <span className="mr-2 font-mono text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                      Risk
                    </span>
                    {scope.risk}
                  </p>
                )}
                {scope.files.length > 0 && (
                  <p className="flex flex-wrap gap-1.5">
                    {scope.files.map((f) => (
                      <span
                        key={f}
                        className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-600 ring-1 ring-slate-200"
                      >
                        {f}
                      </span>
                    ))}
                  </p>
                )}
                {scope.duplicateOfId && (
                  <p className="text-xs text-amber-800">
                    Looks like a duplicate of an existing open item. Approve
                    one, reject the other.
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2 rounded-md bg-slate-50 p-3 text-sm text-slate-500">
                {item.scopeStatus === "pending" ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Claude is scoping this one. Refresh in a minute.
                  </>
                ) : (
                  <>
                    Scoping did not run.
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => act(() => rescopeBacklogItem(item.id))}
                      className="inline-flex items-center gap-1 font-semibold text-[var(--brand)] hover:underline disabled:opacity-50"
                    >
                      <RefreshCw className="size-3" />
                      Scope now
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {item.status === "new" && (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => act(() => setBacklogStatus(item.id, "approved"))}
                    className="rounded-md bg-[var(--brand)] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                  >
                    Approve the fix
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => act(() => setBacklogStatus(item.id, "rejected"))}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </>
              )}
              {item.status === "approved" && (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => act(() => setBacklogStatus(item.id, "done"))}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Mark done
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => act(() => setBacklogStatus(item.id, "rejected"))}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Reject after all
                  </button>
                </>
              )}
              {(item.status === "rejected" || item.status === "done") && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => act(() => setBacklogStatus(item.id, "new"))}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Reopen
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
