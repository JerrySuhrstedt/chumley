import Link from "next/link";
import { Lock } from "lucide-react";

/**
 * Why nothing is saving.
 *
 * A team that can read everything and change nothing reads as the app
 * being broken unless something says otherwise. Says what happened, that
 * the data is fine, and where the one button is.
 *
 * Two wordings, because the two audiences are not the same. Somebody whose
 * subscription lapsed had a plan. Somebody whose trial ran out never did,
 * and telling them their "plan ended" sounds like a billing fault on an
 * account they have never paid into.
 */
export function ReadOnlyBanner({
  endedAt,
  reason,
}: {
  endedAt: Date | null;
  reason: "trial" | "plan";
}) {
  const ended = endedAt
    ? ` on ${endedAt.toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
      })}`
    : "";

  const trial = reason === "trial";

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 md:px-6">
      <Lock className="size-4 shrink-0" />
      <span className="font-semibold">
        {trial ? `Your free trial ended${ended}.` : `Your plan ended${ended}.`}
      </span>
      <span>
        Everything is still here, and read-only until{" "}
        {trial ? "you pick a plan" : "it restarts"}.
      </span>
      <Link
        href="/settings/billing"
        className="font-semibold underline underline-offset-2"
      >
        {trial ? "See the plans" : "Restart it"}
      </Link>
    </div>
  );
}
