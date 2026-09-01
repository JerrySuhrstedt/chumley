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
      onClick={reopenChecklist}
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

/**
 * The same way back, for the account menu.
 *
 * The sidebar button was added on 08-30 and Joudi still reported the
 * checklist as unrecoverable on 08-31, because the sidebar is
 * `hidden ... md:flex`: it does not exist below 768px. The escape hatch
 * was real and it was on a surface a phone never renders, which for a
 * product built to be used from a phone is the same as not having one.
 *
 * He asked for it "under the user avatar menu or top bar". That is
 * exactly right, and it is the one control a phone always has.
 */
export function reopenChecklist(): void {
  try {
    localStorage.removeItem(CHECKLIST_HIDDEN_KEY);
  } catch {
    // Storage blocked. The event still re-opens it for this page view.
  }
  window.dispatchEvent(new Event(REOPEN_CHECKLIST_EVENT));
}
