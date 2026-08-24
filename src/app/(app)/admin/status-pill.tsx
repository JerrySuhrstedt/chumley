import type { AccountStatus } from "@/lib/admin-data";

/**
 * What is happening with a team's money, in one word.
 *
 * "Free" rather than "inactive" or "none": while Chumley is in early access
 * that is the normal state, not a fault, and a red badge on five of seven
 * rows would train the eye to ignore the column.
 *
 * "Ending" rather than "cancelled" for a scheduled cancellation. Paddle
 * keeps those active right up to the date, and the two need telling
 * apart: one is still paying and still working, the other has stopped.
 */
const LOOK: Record<AccountStatus, { label: string; className: string }> = {
  off: { label: "Switched off", className: "bg-slate-800 text-white" },
  // Violet, so a gift does not read as a fault or as a sale.
  comped: { label: "Comped", className: "bg-violet-100 text-violet-800" },
  free: { label: "Free", className: "bg-slate-100 text-slate-600" },
  trialing: { label: "Trial", className: "bg-indigo-100 text-indigo-800" },
  active: { label: "Active", className: "bg-emerald-100 text-emerald-800" },
  past_due: { label: "Payment failed", className: "bg-red-100 text-red-800" },
  paused: { label: "Paused", className: "bg-amber-100 text-amber-900" },
  ending: { label: "Ending", className: "bg-amber-100 text-amber-900" },
  canceled: { label: "Cancelled", className: "bg-slate-200 text-slate-700" },
};

const day = (d: Date) =>
  d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

export function StatusPill({
  status,
  endsAt,
  seats,
  compedUntil,
}: {
  status: AccountStatus;
  endsAt: Date | null;
  seats: number | null;
  /** Null on a comped row means the free account has no end date. */
  compedUntil?: Date | null;
}) {
  const look = LOOK[status];

  return (
    <span className="flex flex-col gap-0.5 whitespace-nowrap">
      <span
        className={`inline-flex w-fit items-center rounded px-1.5 py-0.5 text-[11px] font-bold tracking-wide uppercase ${look.className}`}
      >
        {look.label}
      </span>
      {status === "ending" && endsAt && (
        <span className="text-[11px] text-slate-500">till {day(endsAt)}</span>
      )}
      {status === "comped" && (
        <span className="text-[11px] text-slate-500">
          {compedUntil ? `till ${day(compedUntil)}` : "no end date"}
        </span>
      )}
      {seats !== null &&
        status !== "free" &&
        status !== "off" &&
        status !== "comped" &&
        status !== "canceled" && (
        <span className="text-[11px] text-slate-500">
          {seats} seat{seats === 1 ? "" : "s"}
        </span>
      )}
    </span>
  );
}
