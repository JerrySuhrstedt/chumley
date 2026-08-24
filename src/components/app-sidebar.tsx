"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Contact,
  KanbanSquare,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ReportButton } from "@/app/(app)/_report/report-button";
import { ChumleyMark } from "@/components/chumley-mark";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/contacts", label: "Contacts", icon: Contact },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
];

const STORAGE_KEY = "ssc:nav-collapsed";

export function AppSidebar({
  isAdmin = false,
}: {
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Restore the user's preference on mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read persisted UI preference
    setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
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
        "hidden shrink-0 flex-col transition-[width] duration-200 md:flex",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Matches the header height so the nav and page content start on the
          same line. */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center",
          collapsed ? "justify-center" : "px-4"
        )}
      >
        <Link href="/pipeline" title="Chumley" className="min-w-0">
          {/* The mark, not the lockup: the rail is narrow even when it
              is open, and the wordmark would crowd the nav beneath it. */}
          <ChumleyMark className="size-8" />
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2 py-2">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);

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
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        className={cn(
          "mx-2 flex items-center gap-3 rounded-md py-2 text-sm text-[var(--nav-ink)] transition-colors hover:bg-[var(--nav-hover)] hover:text-white",
          collapsed ? "justify-center px-0" : "px-3"
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

      {/* Who you are, and how you leave, both live in the profile menu at
          the top right. They were here as well, which put the same avatar
          and the same sign-out on screen twice, and crowded the two things
          that only exist down here. */}
      <div className="mt-2 border-t border-white/10 p-2">

        {isAdmin && (
          <Link
            href="/admin"
            title="Back office"
            className={cn(
              "flex items-center gap-3 rounded-md py-2 text-sm transition-colors",
              collapsed ? "justify-center px-0" : "px-3",
              pathname.startsWith("/admin")
                ? "bg-[var(--nav-active)] text-white"
                : "text-[var(--nav-ink)] hover:bg-[var(--nav-hover)] hover:text-white"
            )}
          >
            <ShieldCheck className="size-5 shrink-0" />
            {!collapsed && <span>Back office</span>}
          </Link>
        )}

        <ReportButton collapsed={collapsed} />
      </div>
    </aside>
  );
}
