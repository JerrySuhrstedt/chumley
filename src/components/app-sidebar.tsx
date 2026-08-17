"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  KanbanSquare,
  MessageSquareText,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Pipeline", icon: KanbanSquare, exact: true },
  { href: "/settings/team", label: "Team", icon: Users },
  { href: "/settings/templates", label: "Templates", icon: MessageSquareText },
];

const STORAGE_KEY = "ssc:nav-collapsed";

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  // Restore the user's preference before showing labels, so the sidebar
  // doesn't flash open then snap shut.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read persisted UI preference on mount
    setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
    setReady(true);
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      window.localStorage.setItem(STORAGE_KEY, prev ? "0" : "1");
      return !prev;
    });
  }

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col bg-[var(--nav-bg)] transition-[width] duration-200 md:flex",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div
        className={cn(
          "flex h-12 items-center",
          collapsed ? "justify-center" : "px-4"
        )}
      >
        <Link
          href="/"
          className="truncate text-sm font-bold text-white"
          title="Stupid Simple CRM"
        >
          {collapsed ? "SS" : "Stupid Simple CRM"}
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2 py-2">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md py-2 text-sm font-medium transition-colors",
                collapsed ? "justify-center px-0" : "px-3",
                active
                  ? "bg-[var(--nav-active)] text-[var(--nav-ink-active)]"
                  : "text-[var(--nav-ink)] hover:bg-[var(--nav-hover)] hover:text-white"
              )}
            >
              <item.icon className="size-5 shrink-0" />
              {!collapsed && ready && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        className={cn(
          "m-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--nav-ink)] transition-colors hover:bg-[var(--nav-hover)] hover:text-white",
          collapsed && "justify-center px-0"
        )}
      >
        {collapsed ? (
          <ChevronRight className="size-5" />
        ) : (
          <>
            <ChevronLeft className="size-5" />
            <span>Collapse</span>
          </>
        )}
      </button>
    </aside>
  );
}
