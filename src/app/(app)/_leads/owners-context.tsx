"use client";

import { createContext, useContext, useMemo } from "react";

export type OwnerInfo = {
  userId: string;
  label: string;
  avatarUrl: string | null;
};

/**
 * Who is on this team, for anything that renders an owner.
 *
 * Context rather than props because the card renders four layers deep in
 * three different places, and threading a members list through all of
 * them is how a board component grows eleven props.
 *
 * showOwners is false for a team of one: a solo rep owns every deal by
 * definition, and a bubble of their own initials on every card is noise
 * pretending to be information.
 */
const OwnersContext = createContext<{
  members: OwnerInfo[];
  byId: Record<string, OwnerInfo>;
  showOwners: boolean;
  currentUserId: string | null;
  isTeamOwner: boolean;
}>({
  members: [],
  byId: {},
  showOwners: false,
  currentUserId: null,
  isTeamOwner: false,
});

export function OwnersProvider({
  members,
  currentUserId,
  isTeamOwner,
  children,
}: {
  members: OwnerInfo[];
  currentUserId: string | null;
  isTeamOwner: boolean;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({
      members,
      byId: Object.fromEntries(members.map((m) => [m.userId, m])),
      showOwners: members.length > 1,
      currentUserId,
      isTeamOwner,
    }),
    [members, currentUserId, isTeamOwner]
  );
  return (
    <OwnersContext.Provider value={value}>{children}</OwnersContext.Provider>
  );
}

export function useOwners() {
  return useContext(OwnersContext);
}

export function initialsOf(label: string) {
  return label
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
