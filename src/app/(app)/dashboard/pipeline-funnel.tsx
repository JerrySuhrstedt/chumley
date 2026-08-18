import type { LeadStage } from "../_leads/actions";

export type FunnelStage = {
  value: LeadStage;
  label: string;
  count: number;
  amount: number;
};

/**
 * Stage progression is ordered magnitude, not identity, so it takes a
 * sequential one-hue ramp deepening toward the close rather than a different
 * hue per stage. Won uses the status "good" step because it is an outcome,
 * not another rung.
 *
 * Steps validated against the palette checker: all sit inside the lightness
 * band, clear the chroma floor, and hold CVD separation. Adjacent blues sit
 * just under the categorical separation threshold by design — a sequential
 * ramp is meant to step gently, and every bar carries a text label and count
 * so nothing is identified by color alone.
 */
const FILL: Record<string, string> = {
  new_lead: "#6da7ec",
  contacted: "#2a78d6",
  proposal_sent: "#184f95",
  won: "#0ca30c",
};

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

export function PipelineFunnel({
  stages,
  lost,
}: {
  stages: FunnelStage[];
  lost: FunnelStage;
}) {
  const top = stages[0]?.count ?? 0;
  const entered = stages.reduce((sum, s) => sum + s.count, 0) + lost.count;

  if (entered === 0) {
    return (
      <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        No deals in the pipeline yet. Add a lead and it shows up here.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <ul className="flex flex-col gap-2">
        {stages.map((stage) => {
          // Width is share of the widest stage, floored so a non-zero stage
          // never renders as an invisible sliver.
          const ofWidest = top > 0 ? stage.count / top : 0;
          const width = stage.count === 0 ? 0 : Math.max(ofWidest * 100, 12);

          // Share of everything in the pipeline. A "% from the stage above"
          // would imply conversion, which a snapshot can't support: a won
          // deal has already left the earlier stages, so the ratio between
          // two current counts is not a conversion rate.
          const share = entered > 0 ? Math.round((stage.count / entered) * 100) : 0;

          return (
            <li key={stage.value}>
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span className="font-medium text-slate-700">
                  {stage.label}
                </span>
                <span className="text-slate-500">
                  {stage.count}
                  {stage.amount > 0 ? ` · ${money(stage.amount)}` : ""}
                  <span className="ml-2 text-xs text-slate-400">
                    {share}% of pipeline
                  </span>
                </span>
              </div>

              {/* Centered bar tapering down the stages gives the funnel shape. */}
              <div className="flex h-7 justify-center">
                <div
                  className="flex items-center justify-center rounded transition-[width]"
                  style={{
                    width: `${width}%`,
                    backgroundColor: FILL[stage.value] ?? "#9ec5f4",
                  }}
                >
                  {stage.count > 0 && width >= 18 && (
                    <span className="text-xs font-semibold text-white">
                      {stage.count}
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
        <span className="flex items-center gap-2 text-slate-600">
          <span
            aria-hidden
            className="size-2.5 rounded-full"
            style={{ backgroundColor: "#d03b3b" }}
          />
          Lost
        </span>
        <span className="text-slate-500">
          {lost.count}
          {lost.amount > 0 ? ` · ${money(lost.amount)}` : ""}
        </span>
      </div>
    </div>
  );
}
