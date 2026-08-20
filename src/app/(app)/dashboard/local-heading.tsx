"use client";

import { useSyncExternalStore } from "react";
import { greetingFor, localToday } from "@/lib/today";

/**
 * The reader's own clock, treated as what it is: an external source the
 * component subscribes to.
 *
 * The dashboard is server-rendered and Vercel runs in UTC, so it wished
 * somebody in Arizona good evening at three in the afternoon, showed
 * tomorrow's date all evening, and counted tomorrow's next steps as due
 * today. None of that is knowable on the server, so none of it is
 * decided there.
 *
 * Every snapshot is a plain string that only changes when the answer
 * changes, which is what keeps useSyncExternalStore from re-rendering on
 * every tick.
 */
function subscribe(onChange: () => void) {
  // A minute is well inside the smallest thing that can change here, and
  // a board left open overnight is the normal case for a rep who never
  // closes the tab.
  const id = setInterval(onChange, 60_000);
  return () => clearInterval(id);
}

/** Today where the reader is, or null before the browser has answered. */
export function useLocalToday(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => localToday(),
    // There is no date the server could give that would be right.
    () => null
  );
}

function useGreeting(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => greetingFor(),
    () => null
  );
}

export function LocalHeading() {
  const today = useLocalToday();
  const greeting = useGreeting();

  // Built from the local date string, so it formats the reader's day and
  // not the server's.
  const shown = today
    ? new Date(`${today}T00:00:00`).toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    // Height held so the page does not jump when these fill in.
    <div className="min-h-[3.25rem]">
      <p className="text-sm text-slate-500">{shown ?? " "}</p>
      <h1 className="text-2xl font-semibold text-slate-900">
        {greeting ?? " "}
      </h1>
    </div>
  );
}

type Scheduled = { nextActionDue: string | null };

/** How many next steps are due or late, by the reader's clock. */
export function DueCount({ leads }: { leads: Scheduled[] }) {
  const today = useLocalToday();
  if (!today) return <>{" "}</>;
  const n = leads.filter(
    (l) => l.nextActionDue && l.nextActionDue <= today
  ).length;
  return <>{n.toLocaleString()}</>;
}

/** The red count beside "What needs doing". Absent when nothing is late. */
export function OverdueBadge({ leads }: { leads: Scheduled[] }) {
  const today = useLocalToday();
  if (!today) return null;
  const n = leads.filter(
    (l) => l.nextActionDue && l.nextActionDue < today
  ).length;
  if (n === 0) return null;
  return (
    <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
      {n} overdue
    </span>
  );
}
