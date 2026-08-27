import { Check, Mail, MessageSquare, Phone } from "lucide-react";

/**
 * The five features that close, each with a drawn vignette.
 *
 * Drawn rather than screenshotted on purpose: a real screenshot is stale
 * the week the UI shifts, renders text too small to read at this size,
 * and drags a binary into the repo. These are built from the same tokens
 * as the product, so they stay true by construction and legible by
 * design. Columns alternate left and right so the page has a gait.
 */

/* ------------------------------------------------------------ vignettes */

function Card({
  name,
  company,
  value,
  chip,
  chipTone = "amber",
  lift = false,
}: {
  name: string;
  company: string;
  value: string;
  chip?: string;
  chipTone?: "amber" | "green";
  lift?: boolean;
}) {
  return (
    <div
      className={`rounded-lg bg-white p-3 shadow-[0_1px_2px_rgba(9,30,66,0.2)] ${
        lift ? "-rotate-3 shadow-[0_14px_28px_-8px_rgba(9,30,66,0.4)]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        {chip && (
          <span
            className={`truncate rounded px-1.5 py-0.5 text-[10px] font-semibold ${
              chipTone === "green"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-900"
            }`}
          >
            {chip}
          </span>
        )}
        <span className="ml-auto text-sm font-bold text-slate-900">{value}</span>
      </div>
      <p className="mt-1.5 text-[13px] font-semibold text-slate-900">{name}</p>
      <p className="text-[11px] text-slate-500">{company}</p>
    </div>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--rule)] bg-[var(--board-bg,#eef1f5)] p-4 shadow-[0_18px_44px_-18px_rgba(9,30,66,0.35)] sm:p-5">
      {children}
    </div>
  );
}

function OnboardingVignette() {
  return (
    <Frame>
      <div className="relative">
        <div className="grid grid-cols-2 gap-3 opacity-40">
          <div className="rounded-xl bg-slate-200/70 p-2">
            <p className="px-1 pb-1.5 text-[11px] font-bold text-slate-500">New Lead</p>
            <Card name="Dale Whitaker" company="Whitaker Mechanical" value="$8,500" chip="Call to introduce" />
          </div>
          <div className="rounded-xl bg-slate-200/70 p-2">
            <p className="px-1 pb-1.5 text-[11px] font-bold text-slate-500">Contacted</p>
            <Card name="Rosa Nunez" company="Copper Ridge Builders" value="$21,000" chip="Send the quote" />
          </div>
        </div>
        {/* The spotlight, exactly as the tour draws it. */}
        <div className="absolute top-6 left-0 w-[calc(50%-6px)] rounded-xl ring-4 ring-[var(--brand)]">
          <Card name="Dale Whitaker" company="Whitaker Mechanical" value="$8,500" chip="Call to introduce" />
        </div>
        <div className="relative mt-5 ml-4 max-w-[15rem] rounded-xl bg-white p-3.5 shadow-xl">
          <span className="absolute -top-1.5 left-8 size-3 rotate-45 bg-white" />
          <p className="text-[13px] font-bold text-slate-900">This is a sample lead</p>
          <p className="mt-1 text-[12px] leading-snug text-slate-600">
            Drag it, open it, delete it. None of it is real, so you cannot
            break anything.
          </p>
          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">1 of 2</span>
            <span className="rounded-md bg-[var(--brand)] px-2.5 py-1 text-[11px] font-bold text-white">
              Got it
            </span>
          </div>
        </div>
      </div>
    </Frame>
  );
}

function PipelineVignette() {
  return (
    <Frame>
      <div className="grid grid-cols-3 gap-3">
        {[
          ["New Lead", <Card key="a" name="Dale Whitaker" company="Whitaker Mechanical" value="$8,500" chip="Call to introduce" />],
          ["Contacted", <Card key="b" name="Rosa Nunez" company="Copper Ridge Builders" value="$21,000" chip="Send the quote" />],
          ["Proposal Sent", null],
        ].map(([title, card]) => (
          <div key={String(title)} className="rounded-xl bg-slate-200/70 p-2">
            <p className="px-1 pb-1.5 text-[11px] font-bold text-slate-500">{title}</p>
            {card}
            {title === "Proposal Sent" && (
              <>
                <div className="rounded-lg border-2 border-dashed border-[var(--brand)]/50 bg-[var(--brand)]/5 p-3">
                  <p className="text-center text-[11px] font-semibold text-[var(--brand)]">
                    Drop it here
                  </p>
                </div>
                <div className="mt-2">
                  <Card name="Marcus Hall" company="Hall & Sons Plumbing" value="$34,000" chip="Follow up" lift />
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </Frame>
  );
}

function OneTapVignette() {
  return (
    <Frame>
      <div className="mx-auto max-w-[17rem]">
        <Card name="Rosa Nunez" company="Copper Ridge Builders" value="$21,000" chip="Hot" chipTone="green" />
        <div className="mt-3 flex justify-center gap-3">
          {[
            [Phone, true],
            [MessageSquare, false],
            [Mail, false],
          ].map(([Icon, active], i) => {
            const I = Icon as typeof Phone;
            return (
              <span
                key={i}
                className={`flex size-11 items-center justify-center rounded-xl ${
                  active
                    ? "bg-[var(--brand)] text-white shadow-lg"
                    : "border border-slate-200 bg-white text-slate-500"
                }`}
              >
                <I className="size-5" />
              </span>
            );
          })}
        </div>
        <p className="mt-3 rounded-full bg-slate-900 px-4 py-2 text-center text-[12px] font-semibold text-white">
          Calling Rosa Nunez…
        </p>
      </div>
    </Frame>
  );
}

function LoggingVignette() {
  return (
    <Frame>
      <div className="flex flex-col gap-2.5">
        {[
          ["Called Rosa Nunez", "Just now · logged itself", true],
          ["Texted Marcus Hall", "Tue 2:40 pm · logged itself", false],
          ["Emailed Dale Whitaker", "Tue 11:05 am · logged itself", false],
        ].map(([title, when, fresh]) => (
          <div
            key={String(title)}
            className={`flex items-center gap-3 rounded-lg bg-white p-3 shadow-[0_1px_2px_rgba(9,30,66,0.15)] ${
              fresh ? "ring-2 ring-[var(--brand)]/40" : ""
            }`}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <Check className="size-4 text-emerald-700" strokeWidth={3} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-slate-900">{title}</p>
              <p className="text-[11px] text-slate-500">{when}</p>
            </div>
          </div>
        ))}
        <p className="mt-1 text-center text-[11px] text-slate-500">
          Nobody typed any of this in.
        </p>
      </div>
    </Frame>
  );
}

function DashboardVignette() {
  const bars = [35, 55, 40, 70, 62, 90, 100];
  return (
    <Frame>
      <div className="grid grid-cols-3 gap-2.5">
        {[
          ["$34,000", "Money won"],
          ["7", "Deals working"],
          ["2", "Due today"],
        ].map(([n, label]) => (
          <div key={label} className="rounded-lg bg-white p-2.5 text-center shadow-[0_1px_2px_rgba(9,30,66,0.15)]">
            <p className="text-lg font-extrabold text-slate-900 tabular-nums">{n}</p>
            <p className="text-[10px] font-medium text-slate-500">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg bg-white p-3 shadow-[0_1px_2px_rgba(9,30,66,0.15)]">
        <p className="text-[11px] font-semibold text-slate-500">Pipeline value, last 7 weeks</p>
        <div className="mt-2 flex h-16 items-end gap-1.5">
          {bars.map((h, i) => (
            <span
              key={i}
              className={`flex-1 rounded-t ${i === bars.length - 1 ? "bg-[var(--brand)]" : "bg-[var(--brand)]/30"}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </Frame>
  );
}

/* ------------------------------------------------------------- sections */

const SHOWCASE: {
  eyebrow: string;
  headline: string;
  sub: string;
  body: string;
  vignette: React.ReactNode;
}[] = [
  {
    eyebrow: "Onboarding",
    headline: "You'll know the whole app in one minute",
    sub: "Two tips, three sample deals, done.",
    body: "Sample deals are already on the board, and a two-step tour points at what to touch. No wizard, nothing to import. Your first real deal lands before the coffee is finished.",
    vignette: <OnboardingVignette />,
  },
  {
    eyebrow: "Pipeline",
    headline: "Drag a deal forward and the pipeline is up to date",
    sub: "Columns you can rename, cards you can move with a thumb.",
    body: "Every deal is a card. Every stage is a column. Moving a deal is one drag, laptop or phone. If you have ever moved a sticky note across a whiteboard, you already know how.",
    vignette: <PipelineVignette />,
  },
  {
    eyebrow: "One tap",
    headline: "Call, text or email straight from the card",
    sub: "The phone number is the button.",
    body: "Tap the phone icon and your phone is dialing. Text and email open pre-filled, templates one tap away. Half a second between deciding to follow up and doing it. That is the entire trick.",
    vignette: <OneTapVignette />,
  },
  {
    eyebrow: "Activity log",
    headline: "It writes down what you did, so you don't have to",
    sub: "Every call, text and email logs itself, with a timestamp.",
    body: "Tap call, text or email and it is on the record: who, what, when. No end-of-day data entry. The history every CRM promises, without the typing every CRM requires.",
    vignette: <LoggingVignette />,
  },
  {
    eyebrow: "Dashboard",
    headline: "Your week, in numbers you can act on",
    sub: "Money won, deals working, and what's due today.",
    body: "One screen answers the morning: what did we win, what is moving, who needs a call before lunch. Computed live from the board you already keep. Nobody compiles anything.",
    vignette: <DashboardVignette />,
  },
];

export function FeatureShowcase() {
  return (
    <div className="flex flex-col gap-20 lg:gap-28">
      {SHOWCASE.map((f, i) => (
        <div
          key={f.eyebrow}
          className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
        >
          <div className={i % 2 === 1 ? "lg:order-last" : ""}>
            <p className="text-xs font-bold tracking-widest text-[var(--brand)] uppercase">
              {f.eyebrow}
            </p>
            <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-balance text-[var(--ink)] sm:text-3xl">
              {f.headline}
            </h3>
            <p className="mt-2 text-lg font-semibold text-[var(--ink-soft)]">
              {f.sub}
            </p>
            <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-[var(--ink-soft)]">
              {f.body}
            </p>
          </div>
          <div>{f.vignette}</div>
        </div>
      ))}
    </div>
  );
}
