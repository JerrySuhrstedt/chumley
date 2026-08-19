"use client";

import { createContext, useContext } from "react";
import type { BoardStage } from "./stages";

/**
 * The team's buckets, available anywhere inside the app.
 *
 * Provided from the layout rather than passed down, because the board,
 * the contacts list, the quick-add dialog and the lead detail dialog all
 * need the same list and three of them are opened from more than one
 * screen. Threading it as a prop meant six components carrying something
 * none of them owned.
 */
const StagesContext = createContext<BoardStage[]>([]);

export function StagesProvider({
  stages,
  children,
}: {
  stages: BoardStage[];
  children: React.ReactNode;
}) {
  return (
    <StagesContext.Provider value={stages}>{children}</StagesContext.Provider>
  );
}

/** Every bucket, including the off-board Contact one. */
export function useStages() {
  return useContext(StagesContext);
}

/** Just the board columns, left to right. */
export function useBoardStages() {
  return useContext(StagesContext).filter((s) => s.kind !== "contact");
}
