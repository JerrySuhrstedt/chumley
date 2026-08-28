"use client";

import { useActionState, useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Trash2 } from "lucide-react";
import { CopiedChip } from "@/components/copied-chip";
import type { AdminUatTester } from "@/lib/admin-data";
import {
  createBlankUatTester,
  createUatTester,
  deleteUatTester,
  type CreateTesterResult,
} from "./uat-actions";

const INITIAL: CreateTesterResult = { error: null };

/**
 * Personal tester links. Add a name and an email, copy the link, send it
 * however you like; the tester's run follows the link across devices.
 * Nothing here emails anyone: the owner texting a link is the delivery
 * mechanism, and that is a feature.
 */
export function Testers({
  testers,
  origin,
}: {
  testers: AdminUatTester[];
  origin: string;
}) {
  const [state, formAction, pending] = useActionState(createUatTester, INITIAL);
  const [busy, start] = useTransition();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <form
        action={formAction}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4"
      >
        <label className="flex min-w-40 flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
          Name
          <input
            name="name"
            required
            placeholder="Mike Sanders"
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900"
          />
        </label>
        <label className="flex min-w-52 flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
          Email
          <input
            name="email"
            type="email"
            required
            placeholder="mike@example.com"
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[var(--brand)] px-3.5 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {pending && (
            <Loader2 className="mr-1.5 inline size-3.5 animate-spin align-[-2px]" />
          )}
          Create link
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => start(async () => void (await createBlankUatTester()))}
          title="No name or email needed. Whoever opens it first claims it as theirs."
          className="rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Blank link
        </button>
        {state.error && (
          <p className="w-full text-sm text-red-700">{state.error}</p>
        )}
      </form>

      {testers.length > 0 && (
        <ul className="flex flex-col gap-2">
          {testers.map((t) => {
            const url = `${origin}/uat/${t.token}`;
            return (
              <li
                key={t.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-slate-200 bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {t.name || "Unclaimed link"}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {t.email || "whoever opens it first makes it theirs"}
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  {t.reports} {t.reports === 1 ? "run sent" : "runs sent"}
                  {t.draftUpdatedAt && (
                    <>
                      {" "}
                      · {t.draftTried} tried, last active{" "}
                      {formatDistanceToNow(t.draftUpdatedAt, {
                        addSuffix: true,
                      })}
                    </>
                  )}
                </p>
                <span className="ml-auto flex items-center gap-2">
                  <span className="hidden font-mono text-[11px] text-slate-400 sm:inline">
                    /uat/{t.token}
                  </span>
                  <span className="relative inline-flex">
                    <CopiedChip show={copiedId === t.id} />
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(url);
                        setCopiedId(t.id);
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Copy link
                    </button>
                  </span>
                  <button
                    type="button"
                    disabled={busy}
                    aria-label={`Remove ${t.name || "this unclaimed link"}`}
                    onClick={() => {
                      // Their sent reports survive; only the link dies.
                      if (confirm(t.name ? `Remove ${t.name}'s link? Their sent reports stay.` : "Remove this unclaimed link?"))
                        start(async () => void (await deleteUatTester(t.id)));
                    }}
                    className="rounded-md border border-slate-300 bg-white p-1.5 text-slate-500 hover:bg-slate-50 hover:text-red-700 disabled:opacity-50"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
