"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, MousePointerClick } from "lucide-react";
import type { Lead } from "@/db/schema";
import { LeadAvatar } from "../_leads/lead-avatar";
import { PipelineFunnel, type FunnelStage } from "./pipeline-funnel";

const moneyFull = (n: number) => `$${Math.round(n).toLocaleString()}`;

/**
 * The funnel, and whichever bucket you last clicked, side by side.
 *
 * Clicking a band used to navigate to the board, which meant leaving the
 * page to answer a question the page could answer. The deals appear
 * beside the chart instead, and clicking a different colour swaps them,
 * so the whole funnel can be read through without going anywhere.
 */
export function PipelineExplorer({
  stages,
  lost,
  leads,
}: {
  stages: FunnelStage[];
  lost: FunnelStage;
  leads: Lead[];
}) {
  // Nothing chosen to begin with. A panel that opens pre-filled looks
  // like the answer to a question nobody asked.
  const [selected, setSelected] = useState<string | null>(null);

  const all = [...stages, lost];
  const bucket = all.find((s) => s.value === selected) ?? null;
  const inBucket = selected
    ? leads
        .filter((l) => l.stage === selected)
        .sort((a, b) => Number(b.value ?? 0) - Number(a.value ?? 0))
    : [];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <PipelineFunnel
        stages={stages}
        lost={lost}
        selected={selected}
        onSelect={(v) => setSelected((prev) => (prev === v ? null : v))}
      />

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        {!bucket ? (
          <div className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-2 text-center">
            <MousePointerClick className="size-6 text-slate-300" />
            <p className="text-sm font-medium text-slate-700">
              Pick a colour
            </p>
            <p className="max-w-[28ch] text-xs text-slate-500">
              Click any band or any row in the key and the deals in it
              appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="flex min-w-0 items-center gap-2 font-semibold text-slate-900">
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: bucket.color ?? "#94a3b8" }}
                />
                <span className="truncate">{bucket.label}</span>
              </h3>
              <span className="shrink-0 text-sm font-medium text-slate-900">
                {moneyFull(bucket.amount)}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {bucket.count} {bucket.count === 1 ? "deal" : "deals"}
            </p>

            {inBucket.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                Nothing in this bucket yet.
              </p>
            ) : (
              <ul className="mt-3 flex max-h-80 flex-col divide-y divide-slate-100 overflow-y-auto">
                {inBucket.map((lead) => (
                  <li
                    key={lead.id}
                    className="flex items-center gap-2.5 py-2 first:pt-0"
                  >
                    <LeadAvatar lead={lead} className="size-7 text-[11px]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-900">
                        {lead.name}
                      </span>
                      {lead.companyName && (
                        <span className="block truncate text-xs text-slate-500">
                          {lead.companyName}
                        </span>
                      )}
                    </span>
                    {lead.value && (
                      <span className="shrink-0 text-sm font-medium text-slate-700">
                        {moneyFull(Number(lead.value))}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <Link
              href="/pipeline"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--board-bg)] hover:underline"
            >
              Work these on the board <ArrowRight className="size-3.5" />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
