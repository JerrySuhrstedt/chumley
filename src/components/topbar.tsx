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
  { href: "/", label: "Pipeline" },
  { href: "/contacts", label: "Contacts" },
  { href: "/calendar", label: "Calendar" },
  { href: "/settings", label: "Settings" },
];

export function Topbar({ orgName }: { orgName: string }) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between bg-[var(--board-topbar)] px-4 md:px-6">
      <Link
        href="/"
        className="rounded px-2 py-1 text-sm font-semibold text-white transition-colors hover:bg-white/20"
      >
        {orgName}
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
    </header>
  );
}
