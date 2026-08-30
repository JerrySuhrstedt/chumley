"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHECKLIST_HIDDEN_KEY, REOPEN_CHECKLIST_EVENT } from "./events";

/**
 * The way back in. Dismissing the checklist used to be permanent, which
 * turned a tidy-up click into losing onboarding forever. Rendered only
 * while onboarding is incomplete, so it can never become furniture.
 */
export function GettingStartedButton({ collapsed }: { collapsed: boolean }) {
  return (
    <button
      type="button"
      title="Getting started"
      onClick={() => {
        localStorage.removeItem(CHECKLIST_HIDDEN_KEY);
        window.dispatchEvent(new Event(REOPEN_CHECKLIST_EVENT));
      }}
      className={cn(
        "flex w-full items-center gap-3 rounded-md py-2 text-sm text-[var(--nav-ink)] transition-colors hover:bg-[var(--nav-hover)] hover:text-white",
        collapsed ? "justify-center px-0" : "px-3"
      )}
    >
      <Sparkles className="size-5 shrink-0" />
      {!collapsed && <span>Getting started</span>}
    </button>
  );
}
