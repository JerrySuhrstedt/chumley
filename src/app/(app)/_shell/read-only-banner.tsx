import Link from "next/link";
import { Lock } from "lucide-react";

/**
 * Why nothing is saving.
 *
 * A team whose plan has ended can still read everything and change
 * nothing, which without this reads as the app being broken. Says what
 * happened, that the data is fine, and where the one button is.
 */
export function ReadOnlyBanner({ endedAt }: { endedAt: Date | null }) {
  const ended = endedAt
    ? ` on ${endedAt.toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
      })}`
    : "";

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 md:px-6">
      <Lock className="size-4 shrink-0" />
      <span className="font-semibold">Your plan ended{ended}.</span>
      <span>Everything is still here, and read-only until it restarts.</span>
      <Link
        href="/settings/billing"
        className="font-semibold underline underline-offset-2"
      >
        Restart it
      </Link>
    </div>
  );
}
