/**
 * A picture of the sheet, built out of markup rather than a screenshot.
 *
 * Every competitor running this play (Salesmate, OnePageCRM, Smartsheet)
 * drops a flat PNG of their template into the hero. That works until a phone
 * loads it, where a wide spreadsheet screenshot becomes an unreadable smear,
 * and it goes stale the moment the template changes.
 *
 * This is the same thing in HTML. It scales, the type stays sharp, the
 * columns can scroll on their own without dragging the page sideways, and
 * the words in it are real text on the page rather than pixels a crawler
 * cannot read.
 *
 * The two coloured rows are the whole pitch: pink is a follow-up that is
 * late, green is money won. Somebody understands the product from this
 * before they read a word of the copy.
 */

type Row = {
  name: string;
  company: string;
  value: string;
  stage: string;
  next: string;
  due: string;
  tone?: "late" | "won";
};

const ROWS: Row[] = [
  {
    name: "Rosa Nunez",
    company: "Copper Ridge Builders",
    value: "$21,000",
    stage: "Proposal Sent",
    next: "Send the quote she asked for",
    due: "Today",
    tone: "late",
  },
  {
    name: "Dale Whitaker",
    company: "Whitaker Mechanical",
    value: "$8,500",
    stage: "Contacted",
    next: "Call to introduce yourself",
    due: "Sep 2",
  },
  {
    name: "Marcus Hall",
    company: "Hall & Sons Plumbing",
    value: "$34,000",
    stage: "Appointment Set",
    next: "Follow up, he has gone quiet",
    due: "Sep 4",
  },
  {
    name: "Trudy Vance",
    company: "Vance Roofing",
    value: "$12,400",
    stage: "Won",
    next: "Send the start date",
    due: "Sep 6",
    tone: "won",
  },
];

const HEADS = ["Name", "Company", "Value", "Stage", "Next step", "Due"];

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[22px] leading-none font-extrabold text-[var(--brand)] tabular-nums sm:text-[26px]">
        {value}
      </p>
      <p className="mt-1 text-[11px] font-semibold tracking-wide text-[var(--ink-muted)] uppercase">
        {label}
      </p>
    </div>
  );
}

export function SheetPreview() {
  return (
    <figure className="mx-auto my-0 max-w-3xl px-5">
      <div className="overflow-hidden rounded-2xl border border-[var(--rule)] bg-white shadow-[0_18px_44px_-24px_rgba(9,30,66,0.35)]">
        {/* Window chrome, so it reads as a real file rather than a table. */}
        <div className="flex items-center gap-2 border-b border-[var(--rule)] bg-[var(--surface-alt)] px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-[#e5e0dd]" />
            <span className="size-2.5 rounded-full bg-[#e5e0dd]" />
            <span className="size-2.5 rounded-full bg-[#e5e0dd]" />
          </span>
          <p className="truncate text-xs font-semibold text-[var(--ink-muted)]">
            Sales Pipeline Tracker
          </p>
        </div>

        {/* The three numbers that count themselves. */}
        <div className="flex gap-7 border-b border-[var(--rule)] bg-[var(--brand-tint)] px-4 py-3.5 sm:gap-12 sm:px-5">
          <Stat label="Deals working" value="3" />
          <Stat label="Money won" value="$12,400" />
          <Stat label="Due today" value="1" />
        </div>

        {/* Wide content scrolls inside its own box, never the page. */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr>
                {HEADS.map((h) => (
                  <th
                    key={h}
                    className="border-b border-[var(--rule)] bg-[var(--surface-alt)] px-3 py-2 text-[11px] font-bold tracking-wide whitespace-nowrap text-[var(--ink-muted)] uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr
                  key={r.name}
                  className={
                    r.tone === "late"
                      ? "bg-[var(--bucket-lost)]"
                      : r.tone === "won"
                        ? "bg-[var(--bucket-won)]"
                        : ""
                  }
                >
                  <td className="border-b border-[var(--rule)] px-3 py-2.5 text-sm font-semibold whitespace-nowrap text-[var(--ink)]">
                    {r.name}
                  </td>
                  <td className="border-b border-[var(--rule)] px-3 py-2.5 text-sm whitespace-nowrap text-[var(--ink-soft)]">
                    {r.company}
                  </td>
                  <td className="border-b border-[var(--rule)] px-3 py-2.5 text-sm font-semibold whitespace-nowrap text-[var(--ink)] tabular-nums">
                    {r.value}
                  </td>
                  <td className="border-b border-[var(--rule)] px-3 py-2.5 whitespace-nowrap">
                    <span className="rounded-md bg-white/70 px-2 py-1 text-xs font-semibold text-[var(--ink-soft)] ring-1 ring-[var(--rule)] ring-inset">
                      {r.stage}
                    </span>
                  </td>
                  <td className="border-b border-[var(--rule)] px-3 py-2.5 text-sm whitespace-nowrap text-[var(--ink-soft)]">
                    {r.next}
                  </td>
                  <td
                    className={`border-b border-[var(--rule)] px-3 py-2.5 text-sm whitespace-nowrap tabular-nums ${
                      r.tone === "late"
                        ? "font-bold text-[#b3261e]"
                        : "text-[var(--ink-soft)]"
                    }`}
                  >
                    {r.due}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* The two tabs, bottom left, exactly where a spreadsheet puts them. */}
        <div className="flex gap-1 border-t border-[var(--rule)] bg-[var(--surface-alt)] px-3 py-2">
          <span className="rounded-md px-2.5 py-1 text-xs font-semibold text-[var(--ink-muted)]">
            Start here
          </span>
          <span className="rounded-md bg-white px-2.5 py-1 text-xs font-bold text-[var(--ink)] ring-1 ring-[var(--rule)] ring-inset">
            Pipeline
          </span>
        </div>
      </div>

      <figcaption className="mt-3 text-center text-sm text-[var(--ink-muted)]">
        Pink means the follow-up is due or already late. Green means you won it.
        Both happen on their own.
      </figcaption>
    </figure>
  );
}
