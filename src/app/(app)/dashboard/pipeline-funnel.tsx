import type { LeadStage } from "../_leads/actions";

export type FunnelStage = {
  value: LeadStage;
  label: string;
  count: number;
  amount: number;
};

/**
 * Categorical hues, one per stage, validated with the palette checker:
 * lightness, chroma, colour-vision separation and normal-vision separation
 * all pass. Every band is also labelled, so identity never rests on colour.
 */
const FILL: Record<string, string> = {
  new_lead: "#2a78d6",
  contacted: "#eb6834",
  proposal_sent: "#4a3aa7",
  won: "#1baf7a",
};

/**
 * Odds of closing from each stage. Standard pipeline weighting: the further
 * along, the likelier it lands. Won is settled, so it carries no forecast.
 */
export const CLOSE_ODDS: Record<string, number> = {
  new_lead: 0.1,
  contacted: 0.25,
  proposal_sent: 0.5,
  won: 1,
};

const money = (n: number) =>
  n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${Math.round(n)}`;

const moneyFull = (n: number) => `$${Math.round(n).toLocaleString()}`;

// Funnel geometry, in SVG user units.
const W = 320;
const H = 250;
const TOP_W = 300;
const BOTTOM_W = 96;
const MIN_BAND = 26;

export function PipelineFunnel({
  stages,
  lost,
}: {
  stages: FunnelStage[];
  lost: FunnelStage;
}) {
  const totalCount = stages.reduce((sum, s) => sum + s.count, 0);

  if (totalCount + lost.count === 0) {
    return (
      <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        No deals in the pipeline yet. Add a lead and it shows up here.
      </p>
    );
  }

  // Bands present in the funnel. A stage with nothing in it is dropped so the
  // shape stays continuous rather than showing a zero-height sliver.
  const bands = stages.filter((s) => s.count > 0);

  // Height carries the count; the taper is the funnel's shape. Small stages
  // get a floor so their label still fits, with the rest shared by weight.
  const flexible = Math.max(0, H - MIN_BAND * bands.length);

  const heights = bands.map(
    (stage) =>
      MIN_BAND + flexible * (totalCount > 0 ? stage.count / totalCount : 0)
  );

  const shaped = bands.map((stage, i) => {
    const top = heights.slice(0, i).reduce((sum, h) => sum + h, 0);
    return { stage, top, bottom: top + heights[i] };
  });

  // Normalize in case rounding pushed the last band past the canvas.
  const stackHeight = heights.reduce((sum, h) => sum + h, 0);
  const scale = stackHeight > 0 ? H / stackHeight : 1;
  const widthAt = (yy: number) =>
    TOP_W + (BOTTOM_W - TOP_W) * (Math.min(yy, H) / H);

  const cx = W / 2;

  // Weighted forecast: what the open pipeline is worth once each stage is
  // discounted by its odds of closing.
  const forecast = stages
    .filter((s) => s.value !== "won")
    .reduce((sum, s) => sum + s.amount * (CLOSE_ODDS[s.value] ?? 0), 0);

  const openValue = stages
    .filter((s) => s.value !== "won")
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-sm text-slate-500">
          Open pipeline{" "}
          <span className="font-semibold text-slate-900">
            {moneyFull(openValue)}
          </span>
        </p>
        <p className="text-sm text-slate-500">
          Weighted forecast{" "}
          <span className="font-semibold text-slate-900">
            {moneyFull(forecast)}
          </span>
        </p>
      </div>

      {/* Side by side only once there is genuinely room for both. The
          funnel column is a fraction of a grid, so sm was far too eager:
          at laptop widths the chart kept its 340px and the legend had
          nowhere to go. */}
      <div className="flex flex-col items-center gap-6 xl:flex-row xl:items-start">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full max-w-[340px] shrink"
          role="img"
          aria-label="Deals by pipeline stage"
        >
          {shaped.map(({ stage, top, bottom }) => {
            const t = top * scale;
            const b = bottom * scale;
            const wt = widthAt(t);
            const wb = widthAt(b);
            const mid = (t + b) / 2;
            const roomy = b - t >= 30;

            return (
              <g key={stage.value}>
                <polygon
                  points={[
                    `${cx - wt / 2},${t}`,
                    `${cx + wt / 2},${t}`,
                    `${cx + wb / 2},${b}`,
                    `${cx - wb / 2},${b}`,
                  ].join(" ")}
                  fill={FILL[stage.value] ?? "#2a78d6"}
                  /* A hairline in the surface colour separates the bands
                     without breaking the funnel silhouette. */
                  stroke="#ffffff"
                  strokeWidth={2}
                />
                <text
                  x={cx}
                  y={mid}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#ffffff"
                  fontSize={roomy ? 15 : 12}
                  fontWeight={600}
                >
                  {/* Always money, so the bands share one unit. A $0 band is
                      true information: deals with no value recorded. */}
                  {money(stage.amount)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* min-w-0 and flex-1, never w-full. Inside a row, w-full means
            the whole container, so the legend sat beside a 340px chart
            and ran off the edge of the card, clipping every label. */}
        <ul className="flex w-full min-w-0 flex-1 flex-col gap-2 text-sm">
          {stages.map((stage) => {
            const odds = CLOSE_ODDS[stage.value] ?? 0;
            return (
              <li key={stage.value} className="flex items-start gap-2">
                <span
                  aria-hidden
                  className="mt-1 size-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: FILL[stage.value] }}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex justify-between gap-2">
                    <span className="min-w-0 truncate text-slate-700">
                      {stage.label}
                    </span>
                    <span className="shrink-0 font-medium text-slate-900">
                      {moneyFull(stage.amount)}
                    </span>
                  </span>
                  <span className="flex justify-between gap-2 text-xs text-slate-500">
                    <span>
                      {stage.count} {stage.count === 1 ? "deal" : "deals"}
                    </span>
                    <span>
                      {stage.value === "won"
                        ? "closed"
                        : `${Math.round(odds * 100)}% to close`}
                    </span>
                  </span>
                </span>
              </li>
            );
          })}

          <li className="flex items-start gap-2 border-t border-slate-100 pt-2">
            <span
              aria-hidden
              className="mt-1 size-2.5 shrink-0 rounded-sm bg-slate-300"
            />
            <span className="min-w-0 flex-1">
              <span className="flex justify-between gap-2">
                <span className="min-w-0 truncate text-slate-700">Lost</span>
                <span className="shrink-0 font-medium text-slate-500">
                  {moneyFull(lost.amount)}
                </span>
              </span>
              <span className="block text-xs text-slate-500">
                {lost.count} {lost.count === 1 ? "deal" : "deals"}
              </span>
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
