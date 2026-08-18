"use client";

import { useEffect, useState } from "react";
import type { Lead } from "@/db/schema";
import { companyDomainFromEmail, companyLogoUrl } from "@/lib/company";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Identity for a lead, in order of preference:
 *   1. A stored headshot (populated later by enrichment)
 *   2. Their company's favicon, derived from a work email domain
 *   3. Their initials
 *
 * Every step degrades silently — a missing or broken image just falls
 * through to the next option.
 */
export function LeadAvatar({
  lead,
  className,
}: {
  lead: Pick<Lead, "name" | "avatarUrl" | "email">;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  const domain = companyDomainFromEmail(lead.email);
  const headshot = lead.avatarUrl;
  const src = headshot ?? (domain ? companyLogoUrl(domain) : null);

  // Retry when the source changes (e.g. the email was edited).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset failure state for a new image source
    setFailed(false);
  }, [src]);

  const showImage = src && !failed;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold select-none",
        showImage && !headshot
          ? "border border-slate-200 bg-white p-1.5"
          : "bg-[var(--board-bg)] text-white",
        className
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote logos come from arbitrary hosts
        <img
          src={src}
          alt=""
          onError={() => setFailed(true)}
          className={cn(
            "size-full",
            headshot ? "object-cover" : "object-contain"
          )}
        />
      ) : (
        <span>{initials(lead.name)}</span>
      )}
    </div>
  );
}
