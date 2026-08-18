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
import { GlobalSearch } from "@/components/global-search";

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
  avatarUrl,
}: {
  orgName: string;
  displayName: string | null;
  jobTitle: string | null;
  email: string | null;
  avatarUrl: string | null;
}) {
  const person = displayName ?? email ?? null;
  const initial = (person ?? "?").charAt(0).toUpperCase();

  return (
    // Transparent so the sidebar's colour carries across the top as one
    // continuous piece of chrome.
    <header className="flex h-16 shrink-0 items-center justify-between px-4 md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <Link
          href="/pipeline"
          className="-mx-2 shrink-0 rounded px-2 py-1 text-lg font-bold tracking-tight text-white transition-colors hover:bg-white/15 md:text-xl"
        >
          {orgName}
        </Link>

        <div className="hidden flex-1 sm:block">
          <GlobalSearch />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 pl-3">
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

        <Link
          href="/settings/profile"
          aria-label="Your profile"
          className="shrink-0 rounded-full ring-2 ring-transparent transition-all hover:ring-white/40"
        >
          {avatarUrl ? (
            // Arbitrary external host, so a plain img rather than next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="size-9 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-9 items-center justify-center rounded-full bg-white/20 text-sm font-semibold text-white">
              {initial}
            </span>
          )}
        </Link>

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
