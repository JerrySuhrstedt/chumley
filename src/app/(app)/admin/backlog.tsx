"use client";

import { useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { ChevronRight, ClipboardList, Loader2, RefreshCw } from "lucide-react";
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
 * The human ref: tester initials plus the item's global sequence number,
 * "BT-7". The number alone guarantees uniqueness; the initials are there
 * so the ref carries who found it.
 */
function refOf(item: AdminBacklogItem): string {
  const parts = item.testerName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${(first + last).toUpperCase() || "T"}-${item.seq}`;
}

/**
 * The two-step loop, step one: every scoped finding waits here for a
 * decision. Approve is the signal a Claude Code session works from, so
 * the card has to carry enough to decide without opening the code: the
 * tester's words, the proposed fix, the size, and the risk.
 */
export function Backlog({ items }: { items: AdminBacklogItem[] }) {
  const [busy, start] = useTransition();
  // Closed accordion by default: a long backlog should scan as one line
  // per item, and open only where a decision is being made.
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

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
        const isOpen = open.has(item.id);
        return (
          <li
            key={item.id}
            className={`rounded-lg border ${
              item.status === "new"
                ? "border-[var(--brand)]/40 bg-[var(--brand-tint)]"
                : "border-slate-200 bg-white"
            }`}
          >
            {/* Closed is one line: a chevron and the headline. Everything
                else waits inside; the brand tint alone marks needs-review. */}
            <button
              type="button"
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              className="flex w-full items-start gap-2.5 p-4 text-left"
            >
              <ChevronRight
                className={`mt-1 size-4 shrink-0 text-slate-400 transition-transform ${
                  isOpen ? "rotate-90" : ""
                }`}
              />
              <span className="min-w-0 flex-1">
                {/* Green while the item still asks something of somebody;
                    gray once it is done or rejected. */}
                <span
                  className={`block font-mono text-[11px] font-bold ${
                    item.status === "done" || item.status === "rejected"
                      ? "text-slate-400"
                      : "text-emerald-600"
                  }`}
                >
                  {refOf(item)}
                </span>
                <span
                  className={`block text-sm font-semibold text-slate-900 ${
                    isOpen ? "" : "truncate"
                  }`}
                >
                  {scope?.summary ?? titleById.get(item.checkId) ?? item.checkId}
                </span>
              </span>
            </button>

            {isOpen && (
            <div className="px-4 pb-4">
            <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1">
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
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {SIZE_LABEL[scope.size] ?? scope.size}
                </span>
              )}
              <span className="ml-auto text-xs text-slate-500">
                {item.testerName} ·{" "}
                {formatDistanceToNow(item.createdAt, { addSuffix: true })}
              </span>
            </div>
            <p className="border-l-2 border-slate-200 pl-3 text-sm whitespace-pre-wrap text-slate-600">
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
            </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
