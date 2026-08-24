"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProviderPhoto } from "@/lib/provider-photos";

type Choice = string; // a provider name, "custom", or "none"

/**
 * Pick which photo to use. The saved value is a plain URL on the membership
 * row, so this only decides which URL gets written.
 *
 * The bug this replaces: the form used to pre-fill its input with the photo
 * inherited from the sign-in account, so clearing the field looked like it
 * did nothing. Emptiness now genuinely means "none".
 */
export function HeadshotPicker({
  savedUrl,
  providerPhotos,
  initial,
}: {
  savedUrl: string | null;
  providerPhotos: ProviderPhoto[];
  initial: string;
}) {
  const matching = providerPhotos.find((p) => p.url === savedUrl);

  const [choice, setChoice] = useState<Choice>(
    matching ? matching.provider : savedUrl ? "custom" : "none"
  );
  const [custom, setCustom] = useState(matching ? "" : (savedUrl ?? ""));

  const preview =
    choice === "custom"
      ? custom
      : choice === "none"
        ? null
        : (providerPhotos.find((p) => p.provider === choice)?.url ?? null);

  // One hidden field carries the decision, so the server action stays a
  // plain "here is the URL, or nothing".
  const submitted = choice === "custom" ? custom.trim() : (preview ?? "");

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name="avatarUrl" value={submitted} />

      <div className="flex items-center gap-4">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt=""
            className="size-16 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
          />
        ) : (
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-xl font-semibold text-white">
            {initial}
          </span>
        )}
        <div className="text-sm">
          <p className="font-medium text-slate-900">Headshot</p>
          <p className="text-slate-500">
            Shown in the header and on your team list.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {providerPhotos.map((p) => (
          <button
            key={p.provider}
            type="button"
            onClick={() => setChoice(p.provider)}
            aria-pressed={choice === p.provider}
            className={`relative flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-colors ${
              choice === p.provider
                ? "border-[var(--brand)] bg-slate-50"
                : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt="" className="size-12 rounded-full object-cover" />
            <span className="text-xs font-medium text-slate-700">{p.label}</span>
            {choice === p.provider && (
              <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-[var(--brand)]">
                <Check className="size-3 text-white" strokeWidth={3} />
              </span>
            )}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setChoice("custom")}
          aria-pressed={choice === "custom"}
          className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-medium transition-colors ${
            choice === "custom"
              ? "border-[var(--brand)] bg-slate-50 text-slate-900"
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <span className="flex size-12 items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-400">
            URL
          </span>
          Custom
        </button>

        <button
          type="button"
          onClick={() => setChoice("none")}
          aria-pressed={choice === "none"}
          className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-medium transition-colors ${
            choice === "none"
              ? "border-[var(--brand)] bg-slate-50 text-slate-900"
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-base font-semibold text-slate-500">
            {initial}
          </span>
          Initials
        </button>
      </div>

      {choice === "custom" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="customAvatar">Image link</Label>
          <Input
            id="customAvatar"
            type="url"
            inputMode="url"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="https://example.com/your-photo.jpg"
          />
        </div>
      )}
    </div>
  );
}
