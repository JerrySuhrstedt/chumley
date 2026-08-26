import type { AdminWeek } from "@/lib/admin-data";

/**
 * The back office charts. Server-rendered SVG and divs, no chart library,
 * because three visuals do not justify a dependency and the data arrives
 * on the server anyway.
 */

const monday = (d: Date) =>
  d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

/**
 * A 12-point line small enough to live inside a stat tile.
 *
 * The area fill and the endpoint dot are what make it readable at this
 * size; the line alone disappears against white.
 */
export function Sparkline({ points }: { points: number[] }) {
  const max = Math.max(...points, 1);
  const w = 100;
  const h = 26;
  const pad = 2;
  const step = (w - pad * 2) / Math.max(points.length - 1, 1);
  const xy = points.map((p, i) => [
    pad + i * step,
    h - pad - (p / max) * (h - pad * 2),
  ]);
  const line = xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${pad},${h} ${line} ${w - pad},${h}`;
  const [ex, ey] = xy[xy.length - 1];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="mt-1.5 h-6 w-full"
      aria-hidden="true"
    >
      <polygon points={area} className="fill-[var(--brand)] opacity-10" />
      <polyline
        points={line}
        className="stroke-[var(--brand)]"
        fill="none"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={ex} cy={ey} r="2.2" className="fill-[var(--brand)]" />
    </svg>
  );
}

/** The chip beside a stat: which way, and by how much. */
export function Delta({
  value,
  suffix = "7d",
  direction,
}: {
  value: string;
  suffix?: string;
  /** "up" is good news green, "down" is red, "flat" stays out of the way. */
  direction: "up" | "down" | "flat";
}) {
  const look = {
    up: "bg-emerald-50 text-emerald-700",
    down: "bg-red-50 text-red-700",
    flat: "bg-slate-100 text-slate-500",
  }[direction];
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap tabular-nums ${look}`}
    >
      {value}
      {suffix && <span className="font-semibold opacity-70"> · {suffix}</span>}
    </span>
  );
}

/**
 * Signups and new teams per week, twelve weeks.
 *
 * Bars over a line because the honest story at this volume is "empty,
 * empty, empty, launch": discrete counts, mostly zero. A zero week shows
 * a baseline tick rather than nothing, so absence reads as measured.
 */
export function WeeklyGrowth({ weeks }: { weeks: AdminWeek[] }) {
  const max = Math.max(...weeks.map((w) => w.users), 1);

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold text-slate-900">Weekly growth</h2>
        <p className="text-xs text-slate-500">signups and new teams, 12 weeks</p>
      </div>
      <div className="mt-4 flex flex-1 items-end gap-1.5 sm:gap-2.5" style={{ minHeight: "8.5rem" }}>
        {weeks.map((w) => (
          <div
            key={w.week.toISOString()}
            className="flex h-full flex-1 flex-col items-center justify-end gap-1"
            title={`Week of ${monday(w.week)}: ${w.users} signups, ${w.teams} teams`}
          >
            <span className="text-[10px] font-semibold text-slate-500 tabular-nums">
              {w.users > 0 ? w.users : ""}
            </span>
            <div className="flex w-full flex-1 items-end justify-center gap-[3px]">
              <div
                className="w-[38%] max-w-[22px] rounded-t-[5px] bg-[var(--brand)]"
                style={{
                  height: w.users > 0 ? `${(w.users / max) * 100}%` : "2px",
                  opacity: w.users > 0 ? 1 : 0.25,
                }}
              />
              <div
                className="w-[38%] max-w-[22px] rounded-t-[5px] bg-[var(--brand)]/30"
                style={{
                  height: w.teams > 0 ? `${(w.teams / max) * 100}%` : "2px",
                  opacity: w.teams > 0 ? 1 : 0.6,
                }}
              />
            </div>
            <span className="text-[9px] whitespace-nowrap text-slate-400 tabular-nums">
              {monday(w.week)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <i className="inline-block size-2 rounded-[3px] bg-[var(--brand)]" />
          Users
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block size-2 rounded-[3px] bg-[var(--brand)]/30" />
          Teams
        </span>
      </div>
    </div>
  );
}

export type FunnelStep = {
  label: string;
  count: number;
  /** One line on where the drop went. Empty string renders nothing. */
  drop: string;
};

/**
 * Signed up → created a team → added a real deal → paying.
 *
 * All-time cumulative counts rather than a windowed rate, because at this
 * volume a funnel over a week is noise and a funnel over everything is
 * the actual state of the business.
 */
export function Funnel({ steps }: { steps: FunnelStep[] }) {
  const max = Math.max(...steps.map((s) => s.count), 1);
  // Deeper orange as the funnel narrows, so the money end carries weight.
  const shades = ["opacity-45", "opacity-60", "opacity-80", "opacity-100"];

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold text-slate-900">Activation funnel</h2>
        <p className="text-xs text-slate-500">all time</p>
      </div>
      <div className="mt-4 flex flex-1 flex-col justify-center gap-3">
        {steps.map((s, i) => (
          <div key={s.label}>
            <div className="mb-1 flex items-baseline justify-between text-xs">
              <span className="font-semibold text-slate-700">{s.label}</span>
              <span className="text-slate-500 tabular-nums">
                {s.count.toLocaleString()}
              </span>
            </div>
            <div className="h-[22px] overflow-hidden rounded-md bg-slate-100">
              <div
                className={`h-full rounded-md bg-[var(--brand)] ${shades[Math.min(i, shades.length - 1)]}`}
                style={{
                  width: s.count > 0 ? `${(s.count / max) * 100}%` : "3px",
                }}
              />
            </div>
            {s.drop && (
              <p className="mt-0.5 text-[11px] text-slate-400">{s.drop}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
