import { BellOff, ChevronRight, Smartphone, Users } from "lucide-react";

/**
 * Two visuals for the template pillar, built in markup rather than dropped in
 * as screenshots, for the same reasons SheetPreview is: they scale to a phone,
 * the words in them are real text a crawler can read, and they never go stale
 * when the sheet changes.
 *
 * They exist because the page below the download was a wall of prose. A
 * template someone is about to trust should show its shape, not only describe
 * it.
 */

/* ---- The pipeline, as a picture ---------------------------------------- */

const OPEN_STAGES = ["New Lead", "Contacted", "Appointment Set", "Proposal Sent"];

function Chip({
  children,
  tone = "open",
}: {
  children: string;
  tone?: "open" | "won" | "lost";
}) {
  const tones = {
    open: "bg-white text-[var(--ink)] ring-[var(--rule)]",
    won: "bg-[var(--bucket-won)] text-[#166534] ring-[#bfe0c9]",
    lost: "bg-[var(--bucket-lost)] text-[#b3261e] ring-[#f0cccc]",
  } as const;
  return (
    <span
      className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** New Lead through Proposal Sent, then the two ways a deal ends. */
export function PipelineFlow() {
  return (
    <figure className="mx-auto max-w-3xl px-5">
      <div className="rounded-2xl border border-[var(--rule)] bg-[var(--surface-alt)] p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-3">
          {OPEN_STAGES.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <Chip>{s}</Chip>
              {i < OPEN_STAGES.length - 1 && (
                <ChevronRight className="size-4 shrink-0 text-[var(--ink-muted)]" />
              )}
            </div>
          ))}
          <span className="mx-1 text-sm font-semibold text-[var(--ink-muted)]">
            then
          </span>
          <Chip tone="won">Won</Chip>
          <span className="text-sm text-[var(--ink-muted)]">or</span>
          <Chip tone="lost">Lost</Chip>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-sm text-[var(--ink-muted)]">
        Six stages, left to right. A deal starts at New Lead and moves right as
        it gets closer to a yes. Six, not twelve, on purpose.
      </figcaption>
    </figure>
  );
}

/* ---- The three ways a spreadsheet gives out ---------------------------- */

const BREAKS = [
  {
    icon: Smartphone,
    title: "You can't really use it on a phone",
    body: "Which is where you are standing when the call ends and the details are still fresh. Back at a desk, you write down what you remember, not what happened.",
  },
  {
    icon: BellOff,
    title: "It can't tap you on the shoulder",
    body: "The pink row only helps if you happen to open the file. A follow-up you forgot stays invisible until you go looking for it.",
  },
  {
    icon: Users,
    title: "It breaks with two people",
    body: "The moment someone else works from it, you get overwritten cells, a second copy named final-v3, and two versions of the truth.",
  },
];

export function SpreadsheetBreaks() {
  return (
    <div className="mx-auto max-w-3xl px-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {BREAKS.map((b) => (
          <div
            key={b.title}
            className="flex flex-col rounded-2xl border border-[var(--rule)] bg-white p-5"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--brand-tint)] text-[var(--brand)]">
              <b.icon className="size-5" />
            </span>
            <p className="mt-4 font-bold text-[var(--ink)]">{b.title}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--ink-soft)]">
              {b.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
