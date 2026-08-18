import { Mail, MessageSquare, Phone } from "lucide-react";

type Card = {
  name: string;
  company: string;
  value: string;
  step: string;
  tone: "late" | "today" | "ok" | "none";
};

const TONE: Record<Card["tone"], { bg: string; ink: string }> = {
  late: { bg: "var(--label-overdue)", ink: "#fff" },
  today: { bg: "var(--label-today)", ink: "#172b4d" },
  ok: { bg: "var(--label-upcoming)", ink: "#fff" },
  none: { bg: "var(--label-none)", ink: "#172b4d" },
};

const COLUMNS: { title: string; count: string; tint?: string; cards: Card[] }[] =
  [
    {
      title: "New Lead",
      count: "6",
      cards: [
        {
          name: "Dale Whitaker",
          company: "Whitaker Mechanical",
          value: "$18,000",
          step: "No next step",
          tone: "none",
        },
        {
          name: "Rosa Nunez",
          company: "Copper Ridge Builders",
          value: "$7,500",
          step: "Call back Thursday",
          tone: "ok",
        },
      ],
    },
    {
      title: "Contacted",
      count: "4 · $46,000",
      cards: [
        {
          name: "Tom Brennan",
          company: "Brennan HVAC",
          value: "$12,000",
          step: "Send intro email",
          tone: "ok",
        },
        {
          name: "Priya Raman",
          company: "Sunline Electric",
          value: "$22,000",
          step: "Follow up on pricing",
          tone: "late",
        },
      ],
    },
    {
      title: "Proposal Sent",
      count: "3 · $61,000",
      cards: [
        {
          name: "Marcus Hall",
          company: "Hall & Sons Plumbing",
          value: "$34,000",
          step: "Quote expires today",
          tone: "today",
        },
      ],
    },
    {
      title: "Won",
      count: "2 · $29,500",
      tint: "var(--bucket-won)",
      cards: [
        {
          name: "Angela Reyes",
          company: "Reyes Roofing",
          value: "$21,000",
          step: "Kickoff booked",
          tone: "ok",
        },
      ],
    },
  ];

/**
 * A still of the real board, used as the hero visual. Everything here is
 * plain markup rather than a screenshot so it stays crisp on any display
 * and readable at small sizes.
 */
export function BoardPreview() {
  return (
    <div className="overflow-hidden rounded-2xl bg-[var(--board-bg)] p-3 shadow-[0_28px_70px_-24px_rgba(22,41,61,0.55)] ring-1 ring-black/10">
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className="size-2.5 rounded-full bg-white/35" />
        <span className="size-2.5 rounded-full bg-white/35" />
        <span className="size-2.5 rounded-full bg-white/35" />
        <span className="ml-2 text-xs font-medium text-white/80">
          Sunbelt Sales Team
        </span>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {COLUMNS.map((col) => (
          <div
            key={col.title}
            style={{ backgroundColor: col.tint ?? "var(--board-column)" }}
            className="flex w-[150px] shrink-0 flex-col gap-2 rounded-xl p-2 xl:w-[168px]"
          >
            <div className="flex items-baseline justify-between px-1 pt-0.5">
              <span className="text-[13px] font-semibold text-[var(--board-ink)]">
                {col.title}
              </span>
              <span className="text-[10px] text-[var(--board-ink-muted)]">
                {col.count}
              </span>
            </div>

            {col.cards.map((card) => (
              <div
                key={card.name}
                className="rounded-lg bg-white px-2.5 pt-2 pb-2.5 shadow-[0_1px_1px_rgba(9,30,66,0.25)]"
              >
                <span
                  className="mb-1.5 inline-block max-w-full truncate rounded px-1.5 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: TONE[card.tone].bg,
                    color: TONE[card.tone].ink,
                  }}
                >
                  {card.step}
                </span>
                <p className="truncate text-[12px] font-semibold text-[var(--board-ink)]">
                  {card.name}
                </p>
                <p className="truncate text-[10px] text-[var(--board-ink-muted)]">
                  {card.company} · {card.value}
                </p>
                <div className="mt-1.5 flex gap-1 text-[var(--board-ink-muted)]">
                  <Phone className="size-3" />
                  <MessageSquare className="size-3" />
                  <Mail className="size-3" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
