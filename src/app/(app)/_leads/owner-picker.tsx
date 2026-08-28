"use client";

import { useOptimistic, useTransition } from "react";
import { setLeadOwner } from "./actions";
import { initialsOf, useOwners } from "./owners-context";

/**
 * Whose deal this is, and the one-tap way to hand it over.
 *
 * Hidden on a team of one, where ownership is a tautology. The list is
 * the team, the check is server-side, and the change is optimistic
 * because handing a deal across a desk should feel like exactly that.
 */
export function OwnerPicker({
  leadId,
  ownerId,
}: {
  leadId: string;
  ownerId: string | null;
}) {
  const { members, byId, showOwners, currentUserId, isTeamOwner } =
    useOwners();
  // Mirrors the server rule: the team owner moves anything; a member can
  // hand off their own deal and only look at everyone else's.
  const canReassign =
    isTeamOwner || ownerId === null || ownerId === currentUserId;
  const [pending, start] = useTransition();
  const [shown, setShown] = useOptimistic(ownerId);

  if (!showOwners) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-900">Owner</p>
      <p className="mt-0.5 text-xs text-slate-500">
        {canReassign
          ? "Who is working this deal."
          : "Only the team owner can reassign this deal."}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {members.map((m) => {
          const active = shown === m.userId;
          return (
            <button
              key={m.userId}
              type="button"
              disabled={pending || !canReassign}
              aria-pressed={active}
              onClick={() =>
                start(async () => {
                  setShown(m.userId);
                  await setLeadOwner(leadId, m.userId);
                })
              }
              className={`flex items-center gap-2 rounded-full border py-1.5 pr-3 pl-1.5 text-sm font-medium transition-colors ${
                active
                  ? "border-[var(--brand)] bg-[var(--brand-tint)] text-[var(--brand-dark)]"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span
                className={`flex size-6 items-center justify-center overflow-hidden rounded-full text-[10px] font-bold ${
                  active
                    ? "bg-[var(--brand)] text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                <span className="relative flex size-full items-center justify-center">
                  {initialsOf(m.label)}
                  {m.avatarUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.avatarUrl}
                      alt=""
                      onError={(e) => e.currentTarget.remove()}
                      className="absolute inset-0 size-full object-cover"
                    />
                  )}
                </span>
              </span>
              {m.label}
            </button>
          );
        })}
      </div>
      {shown && byId[shown] === undefined && (
        <p className="mt-2 text-xs text-amber-700">
          Currently owned by somebody no longer on the team.
        </p>
      )}
    </div>
  );
}
