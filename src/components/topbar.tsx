import Link from "next/link";
import { Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/app/(app)/actions";

const MOBILE_NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/", label: "Pipeline" },
  { href: "/contacts", label: "Contacts" },
  { href: "/calendar", label: "Calendar" },
  { href: "/settings", label: "Settings" },
];

export function Topbar({
  orgName,
  displayName,
  jobTitle,
  email,
}: {
  orgName: string;
  displayName: string | null;
  jobTitle: string | null;
  email: string | null;
}) {
  const person = displayName ?? email ?? null;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between bg-[var(--board-topbar)] px-4 md:px-6">
      <Link
        href="/"
        className="-mx-2 rounded px-2 py-1 text-lg font-bold tracking-tight text-white transition-colors hover:bg-white/15 md:text-xl"
      >
        {orgName}
      </Link>

      <div className="flex items-center gap-3">
        {person && (
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-sm font-semibold text-white">{person}</p>
            {jobTitle && (
              <p className="text-xs text-white/70">{jobTitle}</p>
            )}
          </div>
        )}

        {/* The sidebar covers navigation on desktop, so this is mobile-only. */}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Menu"
            className="flex size-8 items-center justify-center rounded text-white transition-colors hover:bg-white/20 md:hidden"
          >
            <Menu className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {MOBILE_NAV.map((item) => (
              <DropdownMenuItem
                key={item.href}
                render={<Link href={item.href}>{item.label}</Link>}
              />
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              render={
                <form action={signOut} className="w-full">
                  <button type="submit" className="w-full text-left">
                    Sign out
                  </button>
                </form>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
