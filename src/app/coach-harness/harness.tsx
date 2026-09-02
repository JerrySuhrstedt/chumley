"use client";

import { useEffect } from "react";
import { CoachMarks } from "@/app/(app)/_onboarding/coach-marks";

/** A card the same size and shape as a real one, in a column. */
function Card({ sample, name, company }: { sample: boolean; name: string; company: string }) {
  return (
    <div className="relative">
      <div
        data-coach={sample ? "sample-lead" : undefined}
        className="rounded-lg bg-white p-3 shadow-[0_1px_1px_rgba(9,30,66,0.25)]"
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <span className="truncate rounded bg-amber-100 px-2 py-0.5 text-xs">
            Call to introduce yourself
          </span>
          <span className="font-bold text-slate-900">$8,500</span>
        </div>
        <p className="text-sm font-semibold text-slate-900">{name}</p>
        <p className="text-xs text-slate-500">{company}</p>
        <div className="mt-2 flex gap-2">
          {["call", "text", "mail"].map((k) => (
            <span key={k} className="size-7 rounded border border-slate-200" />
          ))}
        </div>
      </div>
    </div>
  );
}

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="w-[285px] shrink-0 rounded-xl bg-slate-100 p-2">
      <p className="mb-2 px-1 font-bold text-slate-900">{title}</p>
      <div className="flex flex-col gap-2">{children}</div>
      <p className="mt-2 px-1 text-sm text-slate-500">+ Add a lead</p>
    </div>
  );
}

export function Harness() {
  // The tour records having run; the harness exists to run it repeatedly.
  useEffect(() => {
    localStorage.removeItem("chumley.coach.v1");
  }, []);

  return (
    <div className="min-h-screen bg-[var(--board-bg,#f8fafc)] p-4">
      {/* The header row, laid out exactly as the board's is: the button is
          pushed hard right by ml-auto, which is what put the bubble off the
          edge. */}
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-lg bg-white px-4 py-2 shadow-sm">3 Deals working</div>
        <div className="rounded-lg bg-white px-4 py-2 shadow-sm">$0 Money won</div>
        <div className="relative min-w-0 flex-1 md:max-w-xs">
          <input
            placeholder="Search leads"
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </div>
        <div data-coach="add-lead" className="ml-auto">
          <button className="rounded-lg bg-[var(--brand,#f16522)] px-4 py-2 font-bold text-white">
            + Add lead
          </button>
        </div>
      </div>

      {/* Horizontally scrolling columns, samples spread across three of
          them, which is how they are actually seeded. */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        <Column title="New Lead">
          <Card sample name="Dale Whitaker" company="Whitaker Mechanical" />
        </Column>
        <Column title="Contacted">
          <Card sample name="Rosa Nunez" company="Copper Ridge Builders" />
        </Column>
        <Column title="Proposal Sent">
          <Card sample name="Marcus Hall" company="Hall & Sons Plumbing" />
        </Column>
        <Column title="Won">
          <Card sample={false} name="" company="" />
        </Column>
        <Column title="Lost">
          <Card sample={false} name="" company="" />
        </Column>
      </div>

      <CoachMarks enabled userId="harness" />
    </div>
  );
}
