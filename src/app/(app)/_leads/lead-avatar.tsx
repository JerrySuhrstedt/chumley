import type { Lead } from "@/db/schema";
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
 * Headshot slot. Falls back to initials until an avatar is available —
 * social enrichment can populate `avatarUrl` later without touching callers.
 */
export function LeadAvatar({
  lead,
  className,
}: {
  lead: Pick<Lead, "name" | "avatarUrl">;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--board-bg)] font-semibold text-white select-none",
        className
      )}
    >
      {lead.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote avatars come from arbitrary hosts
        <img
          src={lead.avatarUrl}
          alt={lead.name}
          className="size-full object-cover"
        />
      ) : (
        <span>{initials(lead.name)}</span>
      )}
    </div>
  );
}
