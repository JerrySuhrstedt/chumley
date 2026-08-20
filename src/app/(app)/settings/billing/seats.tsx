"use client";

import { useEffect, useState, useTransition } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { changeSeats, previewSeats } from "./actions";
import { TEAM_MIN } from "@/app/(marketing)/pricing/plans";

type Quote = {
  seats: number;
  dueNow: string;
  recurring: string | null;
  currency: string;
  beforeTeamRate: boolean;
};

const money = (amount: string, currency: string) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency }).format(
    Number(amount) / 100
  );

export function Seats({
  paidFor,
  membersNow,
}: {
  paidFor: number;
  membersNow: number;
}) {
  const [want, setWant] = useState(paidFor);
  const [quote, setQuote] = useState<Quote | null>(null);
  // Kept with the seat count it belongs to, so a failure for four seats
  // is not still on screen when the stepper says six.
  const [failure, setFailure] = useState<{ seats: number; message: string } | null>(
    null
  );
  const [saving, startSaving] = useTransition();

  const floor = Math.max(1, membersNow);
  const changed = want !== paidFor;

  // Both derived rather than stored. An answer for the number currently on
  // screen is the only one worth showing, and "still working it out" is
  // simply the absence of one, so neither needs its own state and the
  // effect never has to set any synchronously.
  const error = failure?.seats === want ? failure.message : null;
  const answer = quote?.seats === want ? quote : null;
  const pricing = changed && !answer && !error;

  // Price it as they step, so the number is on screen before they commit.
  useEffect(() => {
    if (!changed) return;
    let live = true;
    const t = setTimeout(async () => {
      const r = await previewSeats(want);
      if (!live) return;
      setFailure(r.error ? { seats: want, message: r.error } : null);
      setQuote(r.quote);
    }, 400);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [want, changed]);

  // Two is not a number anyone can buy, so the stepper hops the gap.
  const step = (by: number) =>
    setWant((s) => {
      const next = s + by;
      if (next < floor) return floor;
      if (next > 1 && next < TEAM_MIN) return by > 0 ? TEAM_MIN : Math.max(floor, 1);
      return Math.min(200, next);
    });

  const save = () =>
    startSaving(async () => {
      const r = await changeSeats(want);
      if (r.error) setFailure({ seats: want, message: r.error });
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add or remove seats</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Seats on your plan
            </p>
            <p className="text-xs text-slate-500">
              {membersNow} in use. You cannot go below that without removing
              someone first.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="One fewer seat"
              onClick={() => step(-1)}
              disabled={want <= floor || saving}
              className="flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white disabled:opacity-40"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-10 text-center text-3xl font-bold text-slate-900">
              {want}
            </span>
            <button
              type="button"
              aria-label="One more seat"
              onClick={() => step(1)}
              disabled={saving}
              className="flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white disabled:opacity-40"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        {changed && pricing && (
          <p className="text-sm text-slate-500">Working out the cost...</p>
        )}

        {answer && (
          <div className="rounded-lg border border-slate-200 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Charged today</span>
              <span className="font-semibold text-slate-900">
                {money(answer.dueNow, answer.currency)}
              </span>
            </div>
            {answer.recurring && (
              <div className="mt-1.5 flex justify-between">
                <span className="text-slate-600">Your bill after that</span>
                <span className="font-semibold text-slate-900">
                  {money(answer.recurring, answer.currency)}
                </span>
              </div>
            )}
            {Number(answer.dueNow) === 0 && (
              <p className="mt-2.5 text-xs text-slate-500">
                Nothing today. You are still in your free trial.
              </p>
            )}

            {answer.beforeTeamRate && (
              <p className="mt-2.5 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                That figure is at the single-person rate, because your plan
                cannot move to team pricing until the trial ends. It drops to
                the team rate automatically on that day. You will not be
                charged more than the number above.
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button onClick={save} disabled={!changed || saving || pricing}>
            {saving
              ? "Updating..."
              : changed
                ? `Change to ${want} seat${want === 1 ? "" : "s"}`
                : "Nothing to change"}
          </Button>
          {changed && !saving && (
            <Button variant="ghost" onClick={() => setWant(paidFor)}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
