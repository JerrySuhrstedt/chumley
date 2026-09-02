"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { searchLeads, type SearchHit } from "@/app/(app)/_leads/actions";
import { useStages } from "@/app/(app)/_leads/stages-context";
import { companyDomainFromEmail, companyLogoUrl } from "@/lib/company";
import { initials } from "@/lib/utils";

export function GlobalSearch() {
  const allStages = useStages();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pending, startTransition] = useTransition();
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced so a fast typist doesn't fire a query per keystroke.
  useEffect(() => {
    const q = query.trim();

    const timer = setTimeout(() => {
      if (q.length < 2) {
        setHits([]);
        return;
      }
      startTransition(async () => {
        const results = await searchLeads(q);
        setHits(results);
        setActive(0);
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Close when clicking away.
  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function go(hit: SearchHit) {
    setOpen(false);
    setQuery("");
    router.push(`/contacts?open=${hit.id}`);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!hits.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % hits.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i - 1 + hits.length) % hits.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const hit = hits[active];
      if (hit) go(hit);
    }
  }

  const showPanel = open && query.trim().length >= 2;

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/60" />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search people, companies, phone..."
        aria-label="Search contacts"
        /* 16px at the phone breakpoint, or iOS Safari zooms the page into
           the field and leaves it zoomed (AT-47). */
        className="h-10 w-full rounded-lg border border-white/20 bg-white/10 pr-8 pl-9 text-base text-white outline-none transition-colors placeholder:text-white/60 focus:border-white/40 focus:bg-white/15 md:text-sm"
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setHits([]);
          }}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-white/60 hover:bg-white/15 hover:text-white"
        >
          <X className="size-3.5" />
        </button>
      )}

      {showPanel && (
        <div className="absolute top-full left-0 z-50 mt-1.5 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {hits.length === 0 ? (
            <p className="px-3 py-4 text-sm text-slate-500">
              {pending ? "Searching..." : `No matches for "${query.trim()}"`}
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {hits.map((hit, i) => {
                const stage = allStages.find((s) => s.key === hit.stage);
                const domain = companyDomainFromEmail(hit.email);
                const detail =
                  [hit.companyName, hit.email, hit.phone]
                    .filter(Boolean)
                    .join(" · ") || "No contact details";

                return (
                  <li key={hit.id}>
                    <button
                      type="button"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        go(hit);
                      }}
                      onMouseEnter={() => setActive(i)}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left ${
                        i === active ? "bg-slate-100" : "hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--brand)] text-xs font-semibold text-white">
                        {domain ? (
                          // eslint-disable-next-line @next/next/no-img-element -- remote logos
                          <img
                            src={companyLogoUrl(domain)}
                            alt=""
                            className="size-full bg-white object-contain p-1"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          initials(hit.name)
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-900">
                          {hit.name}
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                          {detail}
                        </span>
                      </span>

                      {stage && (
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {stage.label}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
