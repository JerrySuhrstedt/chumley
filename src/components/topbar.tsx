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
        {displayName ? (
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-sm font-semibold text-white">{displayName}</p>
            {jobTitle && <p className="text-xs text-white/70">{jobTitle}</p>}
          </div>
        ) : (
          // Without a name we'd just echo the email, which looks like nothing
          // was set. Point at where to set it instead.
          <Link
            href="/settings/profile"
            className="hidden text-right leading-tight sm:block"
          >
            <span className="block text-sm font-semibold text-white underline decoration-white/40 underline-offset-2">
              Add your name
            </span>
            <span className="block text-xs text-white/70">{person}</span>
          </Link>
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
