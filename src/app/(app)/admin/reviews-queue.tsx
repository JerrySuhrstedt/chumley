"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy, Star } from "lucide-react";
import type { AdminReview } from "@/lib/admin-data";
import { adminSetReviewStatus } from "./actions";

/**
 * Where user reviews park until a human routes them.
 *
 * Publish puts one on the homepage. The invite buttons copy a ready
 * message asking the reviewer to repost their own words on Google or
 * Trustpilot, because no platform allows posting on their behalf, and
 * a personal ask with the text pre-written is the next best thing.
 */
function inviteText(r: AdminReview, platform: string, link: string) {
  return (
    `Hi ${r.name.split(" ")[0]},\n\n` +
    `Thanks for the kind words about Chumley... they made my day.\n\n` +
    `Would you mind posting the same review on ${platform}? It takes about ` +
    `30 seconds and helps more than you'd think: ${link}\n\n` +
    `Here's what you wrote, ready to paste:\n\n"${r.quote}"\n\n` +
    `Thanks,\nJerry`
  );
}

const GOOGLE_LINK = "[your Google Business review link]";
const TRUSTPILOT_LINK = "[your Trustpilot review link]";

export function ReviewsQueue({ items }: { items: AdminReview[] }) {
  const router = useRouter();
  const [working, start] = useTransition();
  const [copied, setCopied] = useState<string | null>(null);

  const act = (id: string, status: "new" | "published" | "archived") =>
    start(async () => {
      const r = await adminSetReviewStatus(id, status);
      if (r.error) toast.error(r.error);
      else {
        toast.success(r.message ?? "Done.");
        router.refresh();
      }
    });

  const copy = (r: AdminReview, platform: "Google" | "Trustpilot") => {
    const link = platform === "Google" ? GOOGLE_LINK : TRUSTPILOT_LINK;
    navigator.clipboard.writeText(inviteText(r, platform, link));
    setCopied(r.id + platform);
    setTimeout(() => setCopied(null), 1500);
    toast.success(`${platform} invite copied. Paste it into an email to ${r.name}.`);
  };

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-700">No reviews yet</p>
        <p className="mx-auto mt-1 max-w-[44ch] text-xs text-slate-500">
          Users leave them from Settings. New ones park here until you route
          them: homepage, a Google or Trustpilot invite, or the archive.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((r) => (
        <li
          key={r.id}
          className={`rounded-xl border bg-white p-4 shadow-sm ${
            r.status === "new"
              ? "border-[var(--brand)]/40 bg-[var(--brand-tint)]"
              : "border-slate-200"
          } ${r.status === "archived" ? "opacity-50" : ""}`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`size-3.5 ${
                    i < r.rating
                      ? "fill-[var(--brand)] text-[var(--brand)]"
                      : "text-slate-300"
                  }`}
                />
              ))}
            </span>
            <span className="text-sm font-semibold text-slate-900">{r.name}</span>
            {r.company && (
              <span className="text-xs text-slate-500">· {r.company}</span>
            )}
            {r.orgName && (
              <span className="text-xs text-slate-400">({r.orgName})</span>
            )}
            {!r.consentPublic && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 uppercase">
                No consent · private
              </span>
            )}
            {r.status === "published" && (
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                On the homepage
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-slate-700">&ldquo;{r.quote}&rdquo;</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {r.status !== "published" && r.consentPublic && (
              <button
                type="button"
                disabled={working}
                onClick={() => act(r.id, "published")}
                className="rounded-lg bg-[var(--brand)] px-3 py-1.5 text-xs font-bold text-white hover:bg-[var(--brand-dark)]"
              >
                Publish to homepage
              </button>
            )}
            {r.status === "published" && (
              <button
                type="button"
                disabled={working}
                onClick={() => act(r.id, "new")}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Take it down
              </button>
            )}
            {(["Google", "Trustpilot"] as const).map((platform) => (
              <button
                key={platform}
                type="button"
                onClick={() => copy(r, platform)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                {copied === r.id + platform ? (
                  <Check className="size-3 text-emerald-600" />
                ) : (
                  <Copy className="size-3" />
                )}
                {platform} invite
              </button>
            ))}
            {r.status !== "archived" && (
              <button
                type="button"
                disabled={working}
                onClick={() => act(r.id, "archived")}
                className="ml-auto text-xs font-semibold text-slate-400 hover:text-red-600"
              >
                Archive
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
