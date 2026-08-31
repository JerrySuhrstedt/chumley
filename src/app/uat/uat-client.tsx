"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bug, Check as CheckIcon, Loader2, Paperclip, X } from "lucide-react";
import { ChumleyLogo } from "@/components/chumley-logo";
import {
  claimUatTester,
  saveUatDraft,
  startUatRun,
  submitUatReport,
  type UatSubmitState,
} from "./actions";
import {
  ALL_CHECKS,
  SECTIONS,
  SEVERITIES,
} from "./checks";

type ItemState = {
  tried: boolean;
  flagged: boolean;
  /** The structured write-up: did / expected / actual / browser / extra. */
  did: string;
  expected: string;
  actual: string;
  browser: string;
  extra: string;
  severity: string | null;
  /**
   * The number a timed check asks for, kept as the raw typed string so an
   * empty field is "" rather than NaN. Lives outside the write-up panel:
   * a pass still carries a number, and only failures open the panel.
   */
  measurement: string;
  /**
   * Screenshot ids. Uploaded the moment they are picked, so only the
   * ids travel in drafts and the submission.
   */
  attachments: string[];
};

/**
 * Items as they may arrive from storage: any field optional, and `note`
 * carried by drafts saved before the write-up was split into fields.
 */
export type SavedItems = Record<
  string,
  Partial<Omit<ItemState, "severity">> & {
    severity?: string | null;
    note?: string;
  }
>;

/** Whether the tester has written anything at all about this check. */
function hasText(it: ItemState | undefined): boolean {
  if (!it) return false;
  return [it.did, it.expected, it.actual, it.browser, it.extra].some((s) =>
    s.trim()
  );
}

/** Old single-note drafts land in Additional notes rather than vanishing. */
function normalizeItems(raw: SavedItems | undefined | null): Draft["items"] {
  const items: Draft["items"] = {};
  for (const [id, v] of Object.entries(raw ?? {})) {
    if (!v || typeof v !== "object") continue;
    items[id] = {
      tried: v.tried === true,
      flagged: v.flagged === true,
      did: typeof v.did === "string" ? v.did : "",
      expected: typeof v.expected === "string" ? v.expected : "",
      actual: typeof v.actual === "string" ? v.actual : "",
      browser: typeof v.browser === "string" ? v.browser : "",
      extra:
        typeof v.extra === "string" && v.extra
          ? v.extra
          : typeof v.note === "string"
            ? v.note
            : "",
      severity: typeof v.severity === "string" ? v.severity : null,
      measurement: typeof v.measurement === "string" ? v.measurement : "",
      attachments: Array.isArray(v.attachments)
        ? v.attachments
            .filter((a): a is string => typeof a === "string")
            .slice(0, MAX_SHOTS)
        : [],
    };
  }
  return items;
}

type Draft = {
  first: string;
  last: string;
  email: string;
  started: boolean;
  items: Record<string, ItemState>;
};

/** A named tester arriving through their personal /uat/{token} link. */
export type UatTesterInfo = {
  token: string;
  name: string;
  email: string;
  /** Their run as last saved from any device, or null for a fresh one. */
  savedItems: SavedItems | null;
  /** A retest: only these check ids show. Null means the whole list. */
  focus?: string[] | null;
  /** Bumped per retest; keys the browser draft so each round starts clean. */
  round?: number;
};

const DRAFT_KEY = "chumley-uat-draft-v1";
const MAX_SHOTS = 5;
const EMPTY_ITEM: ItemState = {
  tried: false,
  flagged: false,
  did: "",
  expected: "",
  actual: "",
  browser: "",
  extra: "",
  severity: null,
  measurement: "",
  attachments: [],
};
const INITIAL: UatSubmitState = { error: null, sent: false };

/**
 * The browser draft's key: per-link, and per-round on a retest, so round
 * two never resurfaces round one's write-ups from this device.
 */
function draftKey(tester: UatTesterInfo | null): string {
  if (!tester) return DRAFT_KEY;
  const round = tester.round ?? 0;
  return `${DRAFT_KEY}-${tester.token}${round > 0 ? `-r${round}` : ""}`;
}

function loadDraft(tester: UatTesterInfo | null): Draft {
  // A personal link keys its own browser copy, so two testers sharing a
  // laptop cannot bleed into each other, or into the anonymous page.
  const key = draftKey(tester);
  const [first = "", ...rest] = (tester?.name ?? "").split(" ");
  const empty: Draft = {
    first,
    last: rest.join(" "),
    email: tester?.email ?? "",
    started: false,
    items: {},
  };
  let local: Draft = empty;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Draft>;
      local = {
        first: typeof parsed.first === "string" && parsed.first ? parsed.first : empty.first,
        last: typeof parsed.last === "string" && parsed.last ? parsed.last : empty.last,
        email: typeof parsed.email === "string" && parsed.email ? parsed.email : empty.email,
        started: parsed.started === true,
        items: normalizeItems(parsed.items as SavedItems | undefined),
      };
    }
  } catch {
    // Fall through with what we have.
  }
  // The server copy wins for a personal link: it is what the tester last
  // did on *any* device, while localStorage only knows about this one.
  if (tester?.savedItems && Object.keys(tester.savedItems).length > 0) {
    return { ...local, items: normalizeItems(tester.savedItems) };
  }
  return local;
}

/**
 * The whole run lives in localStorage until the tester presses Send, so
 * closing the tab loses nothing. Only Send talks to the server, except
 * on a personal tester link, where the checklist also autosaves to the
 * server so the same link resumes the run on another device.
 */
export function UatClient({
  tester = null,
  preview = false,
}: {
  tester?: UatTesterInfo | null;
  /** Owner's read-through: intro skipped, nothing saves, nothing sends. */
  preview?: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [starting, setStarting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  // A blank link handed out in a community arrives with no name on it;
  // whoever opens it first introduces themselves and it becomes theirs.
  const claimed = Boolean(tester?.name);
  const [state, formAction, pending] = useActionState(submitUatReport, INITIAL);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydrated = useRef(false);

  // A retest shows only the checks being retested. Everything else about
  // the flow is identical on purpose: same page, same link, same habits.
  const focusSet = useMemo(
    () => (tester?.focus?.length ? new Set(tester.focus) : null),
    [tester]
  );
  const checks = useMemo(
    () =>
      focusSet ? ALL_CHECKS.filter((c) => focusSet.has(c.id)) : ALL_CHECKS,
    [focusSet]
  );
  const sections = useMemo(
    () =>
      focusSet
        ? SECTIONS.map((s) => ({
            ...s,
            checks: s.checks.filter((c) => focusSet.has(c.id)),
          })).filter((s) => s.checks.length > 0)
        : SECTIONS,
    [focusSet]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate the saved draft once, after mount, so the server render stays deterministic
    setDraft(
      preview
        ? { first: "", last: "", email: "", started: true, items: {} }
        : loadDraft(tester)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once; the tester prop never changes after mount
  }, []);

  useEffect(() => {
    if (!draft || preview) return;
    try {
      localStorage.setItem(draftKey(tester), JSON.stringify(draft));
    } catch {
      // Private window. The list still works, it just will not survive the tab.
    }
    // The server copy trails the keystrokes by a moment on purpose. The
    // first run after hydration is skipped: it is the draft we just
    // loaded, not something the tester did.
    if (tester) {
      if (!hydrated.current) {
        hydrated.current = true;
        return;
      }
      if (saveTimer.current) clearTimeout(saveTimer.current);
      const items = draft.items;
      saveTimer.current = setTimeout(() => {
        void saveUatDraft(tester.token, JSON.stringify(items)).catch(() => {
          // The browser copy still has it.
        });
      }, 1500);
    }
  }, [draft, tester, preview]);

  const tried = useMemo(
    () => checks.filter((c) => draft?.items[c.id]?.tried).length,
    [draft, checks]
  );
  const flagged = useMemo(
    () => checks.filter((c) => hasText(draft?.items[c.id])).length,
    [draft, checks]
  );

  if (!draft) return null;

  const patch = (id: string, part: Partial<ItemState>) =>
    setDraft({
      ...draft,
      items: { ...draft.items, [id]: { ...(draft.items[id] ?? EMPTY_ITEM), ...part } },
    });

  // The structured fields fold into one readable note on the wire, so the
  // submit action, the scoping prompt, and the admin display all keep
  // working on a single string.
  const findingsJson = JSON.stringify(
    checks.map((c) => {
      const it = draft.items[c.id] ?? EMPTY_ITEM;
      const note = [
        it.did.trim() && `What I did: ${it.did.trim()}`,
        it.expected.trim() && `Expected: ${it.expected.trim()}`,
        it.actual.trim() && `What happened: ${it.actual.trim()}`,
        it.browser.trim() && `Device/browser: ${it.browser.trim()}`,
        it.extra.trim() && `Notes: ${it.extra.trim()}`,
      ]
        .filter(Boolean)
        .join("\n");
      const seconds = Number.parseInt(it.measurement, 10);
      return {
        id: c.id,
        tried: it.tried,
        note,
        severity: it.severity,
        measurement: Number.isFinite(seconds) && seconds >= 0 ? seconds : null,
        attachments: it.attachments,
      };
    })
  );

  if (state.sent) {
    return (
      <Shell>
        <div className="mx-auto max-w-xl py-24 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Got it. Thank you.</h1>
          <p className="mt-3 text-slate-600">
            Your run is in, {draft.first || "tester"}: {tried} checks tried and{" "}
            {flagged} {flagged === 1 ? "issue" : "issues"} written up. If you find
            more later, come back to this page and send again.
          </p>
        </div>
      </Shell>
    );
  }

  if (!draft.started) {
    return (
      <Shell>
        <div className="mx-auto max-w-xl py-16">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Help us break Chumley
          </h1>
          <p className="mt-3 text-slate-600">
            This is a private tester page. Work through the checks at your own
            pace, tick what you tried, and write up anything that felt wrong.
            Your progress saves on this device until you press Send.
          </p>
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">What you are testing</p>
            <p className="mt-1.5">
              Chumley is a dead-simple CRM for small sales teams: a board of
              deals you drag from new lead to won, with one-tap call, text,
              and email logging. The whole pitch is nothing to set up,
              nothing to learn.
            </p>
            <p className="mt-3 font-semibold text-slate-900">
              Who you are pretending to be
            </p>
            <p className="mt-1.5">
              Picture a roofing or HVAC salesperson standing next to their
              truck between appointments: phone in one hand, sixty seconds
              until the next call, deals living on sticky notes and memory.
              They have already quit two CRMs because logging a call took too
              many taps, they are often over fifty, and they will go straight
              back to their spreadsheet the moment this feels like work. Test
              like that person: hurried, one-handed, standing in the sun. If
              something would annoy them, it is a bug worth writing up.
            </p>
          </div>
          <div className="mt-6 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-950">
            <p className="font-semibold">Three things not to touch</p>
            <ul className="mt-1.5 list-disc pl-5">
              <li>Anything on the Billing screen. Payments are live.</li>
              <li>Delete team. It does exactly what it says.</li>
              <li>Real customer names. Make people up.</li>
            </ul>
          </div>
          {tester && (
            <p className="mt-6 text-sm text-slate-600">
              This is your personal link{claimed ? `, ${draft.first}` : ""}.
              Your progress saves as you go, so you can switch between your
              laptop and your phone and pick up where you left off. Just open
              the same link.
            </p>
          )}
          <form
            className="mt-8 flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              // Introducing yourself on a blank link makes it yours: the
              // name sticks to the link server-side, so every device after
              // this one greets you instead of asking again.
              if (tester && !claimed) {
                void claimUatTester(
                  tester.token,
                  `${draft.first} ${draft.last}`.trim(),
                  draft.email
                ).catch(() => {
                  // The run still works; the submit carries the typed name.
                });
              }
              // A walk-in on plain /uat gets a personal link minted right
              // here, then continues on it: their ticks ride along via the
              // link-keyed localStorage draft, and the server copy starts
              // saving from the first change. If minting fails for any
              // reason, the old anonymous run still works.
              if (!tester && !preview) {
                setStarting(true);
                startUatRun(`${draft.first} ${draft.last}`.trim(), draft.email)
                  .then((res) => {
                    if ("token" in res) {
                      try {
                        localStorage.setItem(
                          `${DRAFT_KEY}-${res.token}`,
                          JSON.stringify({ ...draft, started: true })
                        );
                      } catch {
                        // Fine; the server draft takes over from here.
                      }
                      router.push(`/uat/${res.token}`);
                    } else {
                      setStarting(false);
                      setDraft({ ...draft, started: true });
                    }
                  })
                  .catch(() => {
                    setStarting(false);
                    setDraft({ ...draft, started: true });
                  });
                return;
              }
              setDraft({ ...draft, started: true });
            }}
          >
            {!claimed && (
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                First name
                <input
                  required
                  value={draft.first}
                  onChange={(e) => setDraft({ ...draft, first: e.target.value })}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                Last name
                <input
                  required
                  value={draft.last}
                  onChange={(e) => setDraft({ ...draft, last: e.target.value })}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900"
                />
              </label>
            </div>
            )}
            {!claimed && (
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              Email
              <input
                required
                type="email"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900"
              />
            </label>
            )}
            <button
              type="submit"
              disabled={starting}
              className="mt-2 rounded-lg bg-[var(--brand)] px-5 py-3 text-base font-bold text-white disabled:opacity-60"
            >
              {starting && (
                <Loader2 className="mr-2 inline size-4 animate-spin align-[-2px]" />
              )}
              {starting ? "Setting up your link..." : "Open the punch list"}
            </button>
          </form>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <header className="sticky top-0 z-10 -mx-5 border-b border-slate-200 bg-white/95 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {preview ? "Preview" : `${draft.first} ${draft.last}`}
            </p>
            <p className="text-xs text-slate-500">
              {tried} of {checks.length} tried · {flagged}{" "}
              {flagged === 1 ? "issue" : "issues"}
            </p>
          </div>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-[var(--brand)] transition-all"
              style={{ width: `${(tried / checks.length) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl py-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          {/* The list version is deliberately not shown. It exists so the
              back office can say which list a run was against, and it is
              recorded on the report server-side. On screen it only ever
              confused: a first-run tester saw "Beta 1.1" beside her punch
              list and reasonably concluded she had been sent the second
              round by mistake. */}
          {focusSet ? "Retest" : "Punch list"}
        </h1>
        {focusSet ? (
          <p className="mt-2 max-w-2xl text-slate-600">
            A short return visit: just the {checks.length} checks below,
            covering what got fixed since your last run. Everything you sent
            before is already in, so this starts blank on purpose. Tick each
            one, write up anything still wrong, and attach a screenshot
            where it helps.
          </p>
        ) : (
          <p className="mt-2 max-w-2xl text-slate-600">
            Tick each check once you have tried it. If anything surprised you,
            press <span className="font-semibold">Found something</span> and say
            what happened in your own words. Even the boring ones. Especially the
            boring ones.
          </p>
        )}
        {tester && (
          <p className="mt-3 text-xs text-slate-500">
            Your personal link, good on any device:{" "}
            <span className="font-mono text-[11px] text-slate-600">
              {typeof location !== "undefined" ? location.origin : ""}/uat/
              {tester.token}
            </span>{" "}
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(
                  `${location.origin}/uat/${tester.token}`
                );
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className="font-semibold text-[var(--brand)] hover:underline"
            >
              {copiedLink ? "Copied" : "Copy it"}
            </button>
          </p>
        )}

        {sections.map((section) => (
          <section key={section.key} className="mt-12">
            <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">{section.lede}</p>
            <ul className="mt-4 divide-y divide-slate-200 border-t border-slate-200">
              {section.checks.map((check) => {
                const it = draft.items[check.id] ?? EMPTY_ITEM;
                const open = it.flagged || hasText(it);
                return (
                  <li key={check.id} className="py-4">
                    <div className="flex items-start gap-3.5">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={it.tried}
                        aria-label={`Tried: ${check.what}`}
                        onClick={() => patch(check.id, { tried: !it.tried })}
                        className={`mt-0.5 grid size-6 shrink-0 place-content-center rounded border-2 ${
                          it.tried
                            ? "border-green-700 bg-green-700 text-white"
                            : "border-slate-300 bg-white text-transparent"
                        }`}
                      >
                        <CheckIcon className="size-4" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`font-semibold ${
                            it.tried ? "text-slate-400 line-through" : "text-slate-900"
                          }`}
                        >
                          <span className="mr-2 font-mono text-xs font-semibold text-[var(--brand)]">
                            {check.id}
                          </span>
                          {check.what}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">{check.how}</p>
                        <p className="mt-1.5 text-sm text-slate-700">
                          <span className="mr-2 font-mono text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                            Should
                          </span>
                          {check.should}
                        </p>

                        {/* Outside the write-up panel on purpose: a pass
                            never opens the panel, and a pass with no
                            number is exactly the report we cannot use. */}
                        {check.measurement && (
                          <label className="mt-2.5 flex flex-wrap items-center gap-2.5 text-sm font-medium text-slate-700">
                            {check.measurement.label}
                            <input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              max={36000}
                              value={it.measurement}
                              onChange={(e) =>
                                patch(check.id, { measurement: e.target.value })
                              }
                              placeholder="90"
                              className="w-24 rounded-md border border-slate-300 bg-white px-3 py-2 text-base font-normal text-slate-900"
                            />
                            {it.tried && !it.measurement.trim() && (
                              <span className="text-xs font-normal text-amber-700">
                                You ticked this one, so give us the number.
                                A rough guess beats a blank.
                              </span>
                            )}
                          </label>
                        )}

                        {open ? (
                          <div className="mt-3 flex flex-col gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">
                              Fill in what you can. No field is required, and
                              even one line helps.
                            </p>
                            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                              What you did
                              <textarea
                                value={it.did}
                                onChange={(e) => patch(check.id, { did: e.target.value })}
                                placeholder="The steps, in your own words."
                                rows={2}
                                maxLength={2000}
                                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                              What you expected
                              <textarea
                                value={it.expected}
                                onChange={(e) => patch(check.id, { expected: e.target.value })}
                                placeholder="What you thought would happen."
                                rows={2}
                                maxLength={2000}
                                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                              What actually happened
                              <textarea
                                value={it.actual}
                                onChange={(e) => patch(check.id, { actual: e.target.value })}
                                placeholder="What it did instead."
                                rows={2}
                                maxLength={2000}
                                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                              Device and browser
                              <input
                                value={it.browser}
                                onChange={(e) => patch(check.id, { browser: e.target.value })}
                                placeholder="iPhone 15, Safari"
                                maxLength={200}
                                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                              Additional notes
                              <textarea
                                value={it.extra}
                                onChange={(e) => patch(check.id, { extra: e.target.value })}
                                placeholder="Anything else worth knowing."
                                rows={2}
                                maxLength={2000}
                                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"
                              />
                            </label>
                            <AttachmentRow
                              checkId={check.id}
                              token={tester?.token ?? null}
                              ids={it.attachments}
                              // Preview promises nothing saves, and an
                              // upload is a save, so the control shows
                              // itself but stays inert there.
                              disabled={preview}
                              onChange={(ids) =>
                                patch(check.id, { attachments: ids })
                              }
                            />
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="mr-1 text-xs text-slate-500">
                                How bad did it feel?
                              </span>
                              {SEVERITIES.map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() =>
                                    patch(check.id, {
                                      severity: it.severity === s ? null : s,
                                    })
                                  }
                                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                    it.severity === s
                                      ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                                      : "border-slate-300 bg-white text-slate-600"
                                  }`}
                                >
                                  {s}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() =>
                                  patch(check.id, {
                                    flagged: false,
                                    did: "",
                                    expected: "",
                                    actual: "",
                                    browser: "",
                                    extra: "",
                                    severity: null,
                                    attachments: [],
                                  })
                                }
                                className="ml-auto text-xs font-medium text-slate-500 hover:underline"
                              >
                                Never mind
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => patch(check.id, { flagged: true })}
                            className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--brand)] hover:underline"
                          >
                            <Bug className="size-3.5" />
                            Found something
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {preview ? (
          <p className="mt-14 border-t-2 border-slate-900 pt-6 text-sm text-slate-500">
            Preview mode. Ticks and notes here go nowhere, and there is no
            Send. Testers see a Send button in this spot.
          </p>
        ) : (
        <form action={formAction} className="mt-14 border-t-2 border-slate-900 pt-6">
          <input type="hidden" name="testerName" value={`${draft.first} ${draft.last}`.trim()} />
          <input type="hidden" name="testerEmail" value={draft.email} />
          {tester && <input type="hidden" name="testerToken" value={tester.token} />}
          <input type="hidden" name="findings" value={findingsJson} />
          <p className="text-sm text-slate-600">
            You do not have to finish everything. Send what you have; you can
            come back and send again.
          </p>
          {state.error && (
            <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="mt-4 rounded-lg bg-[var(--brand)] px-6 py-3 text-base font-bold text-white disabled:opacity-60"
          >
            {pending && <Loader2 className="mr-2 inline size-4 animate-spin align-[-2px]" />}
            {pending ? "Sending..." : `Send my report (${tried} tried, ${flagged} ${flagged === 1 ? "issue" : "issues"})`}
          </button>
        </form>
        )}
      </div>
    </Shell>
  );
}

/**
 * Big phone screenshots shrink to a long-side of 1600px JPEG before
 * upload, so a 12MB capture becomes a couple hundred KB and survives
 * the server's 4MB cap. Anything the canvas cannot decode goes up as
 * it is and lets the server rule on it.
 */
async function compressImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 512 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82)
    );
    return blob ?? file;
  } catch {
    return file;
  }
}

/**
 * A picture is worth the whole write-up when the complaint is "this
 * looks wrong". Files upload as they are picked; only ids live in the
 * draft, so a run resumed on another device still shows its shots.
 */
function AttachmentRow({
  checkId,
  token,
  ids,
  disabled = false,
  onChange,
}: {
  checkId: string;
  token: string | null;
  ids: string[];
  /** Owner preview: visible so the page reads true, inert so nothing saves. */
  disabled?: boolean;
  onChange: (ids: string[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const add = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setProblem(null);
    const next = [...ids];
    for (const file of Array.from(files).slice(0, MAX_SHOTS - ids.length)) {
      const blob = await compressImage(file);
      const fd = new FormData();
      fd.set("file", blob, file.name || "screenshot.jpg");
      fd.set("checkId", checkId);
      if (token) fd.set("token", token);
      try {
        const res = await fetch("/api/uat/attachments", {
          method: "POST",
          body: fd,
        });
        const json = (await res.json().catch(() => null)) as {
          id?: string;
          error?: string;
        } | null;
        if (res.ok && json?.id) next.push(json.id);
        else setProblem(json?.error ?? "That one didn't upload. Try it again.");
      } catch {
        setProblem("That one didn't upload. Try it again.");
      }
    }
    onChange(next);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (id: string) => {
    onChange(ids.filter((a) => a !== id));
    // Tidy-up, not correctness: an orphaned row is harmless.
    void fetch(`/api/uat/attachments/${id}`, { method: "DELETE" }).catch(
      () => undefined
    );
  };

  return (
    <div className="flex flex-col gap-1.5">
      {ids.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {ids.map((id) => (
            <span key={id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- tiny thumbnail of a tester upload; next/image buys nothing here */}
              <img
                src={`/api/uat/attachments/${id}`}
                alt="Attached screenshot"
                className="h-16 w-16 rounded-md border border-slate-300 object-cover"
              />
              <button
                type="button"
                onClick={() => remove(id)}
                aria-label="Remove this screenshot"
                className="absolute -top-1.5 -right-1.5 grid size-5 place-content-center rounded-full bg-slate-900 text-white"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {ids.length < MAX_SHOTS && (
        <label
          className={`flex items-center gap-1.5 self-start rounded-md border border-dashed border-slate-400 px-2.5 py-1.5 text-xs font-semibold text-slate-600 ${
            disabled ? "opacity-60" : "cursor-pointer hover:bg-white"
          }`}
        >
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Paperclip className="size-3.5" />
          )}
          {busy
            ? "Uploading..."
            : disabled
              ? "Attach screenshots (off in preview)"
              : ids.length > 0
                ? "Attach another screenshot"
                : "Attach screenshots"}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            disabled={busy || disabled}
            onChange={(e) => void add(e.target.files)}
            className="sr-only"
          />
        </label>
      )}
      {problem && <p className="text-xs text-red-700">{problem}</p>}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-white px-5 pb-24 text-slate-900">
      <div className="mx-auto max-w-3xl pt-8">
        <ChumleyLogo className="h-8 w-auto" />
      </div>
      {children}
    </div>
  );
}
