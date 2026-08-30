"use client";

import { useState, useTransition, type ReactNode } from "react";
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

/** The owner's four tiers, plus the S/M/L rows scoped before the switch. */
const SIZE_LABEL: Record<string, string> = {
  "Super simple": "Super simple · minutes",
  Easy: "Easy · an hour or two",
  Medium: "Medium · up to a day",
  Complex: "Complex · days, handle with care",
  S: "Easy · an hour or two",
  M: "Medium · up to a day",
  L: "Complex · days, handle with care",
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
 *
 * Grouped by where the item is in its life, because one tester run can
 * dump a dozen items at once and a flat list stops scanning. Decisions
 * stay open at the top; approved work and finished items fold away into
 * a count until asked for.
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

  const needsReview = items.filter((i) => i.status === "new");
  const approved = items.filter((i) => i.status === "approved");
  const closed = items.filter(
    (i) => i.status === "done" || i.status === "rejected",
  );

  const list = (group: AdminBacklogItem[]) => (
    <ul className="flex flex-col gap-2.5">
      {group.map((item) => (
        <BacklogCard key={item.id} item={item} busy={busy} act={act} />
      ))}
    </ul>
  );

  return (
    <div className="flex flex-col gap-4">
      {needsReview.length > 0 ? (
        list(needsReview)
      ) : (
        <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
          Nothing waiting on a decision.
        </p>
      )}
      {approved.length > 0 && (
        <BacklogGroup
          label={`Approved · waiting on a build (${approved.length})`}
        >
          {list(approved)}
        </BacklogGroup>
      )}
      {closed.length > 0 && (
        <BacklogGroup label={`Finished · done or rejected (${closed.length})`}>
          {list(closed)}
        </BacklogGroup>
      )}
    </div>
  );
}

/**
 * A folded shelf for items that need no decision right now. Collapsed
 * it is one line with a count, so a long history costs no screen space.
 */
function BacklogGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-1.5 py-1 text-left text-xs font-semibold text-slate-500 hover:text-slate-700"
      >
        <ChevronRight
          className={`size-3.5 transition-transform ${open ? "rotate-90" : ""}`}
        />
        {label}
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

/**
 * One backlog item, closed to a single line by default: a chevron and
 * the headline. Everything else waits inside; the brand tint alone
 * marks needs-review. Open state lives on the card, so approving an
 * item lets it leave the review list already folded.
 */
function BacklogCard({
  item,
  busy,
  act,
}: {
  item: AdminBacklogItem;
  busy: boolean;
  act: (fn: () => Promise<void>) => void;
}) {
  const [isOpen, setOpen] = useState(false);
  const s = STATUS[item.status];
  const scope = item.scope;

  return (
    <li
      className={`rounded-lg border ${
        item.status === "new"
          ? "border-[var(--brand)]/40 bg-[var(--brand-tint)]"
          : "border-slate-200 bg-white"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
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
}
