import Link from "next/link";
import { Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/app/(app)/actions";

export function Topbar({ orgName }: { orgName: string }) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between bg-[var(--board-topbar)] px-4 md:px-6">
      <Link
        href="/"
        className="rounded px-2 py-1 text-sm font-semibold text-white transition-colors hover:bg-white/20"
      >
        {orgName}
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Settings"
          className="flex size-8 items-center justify-center rounded text-white transition-colors hover:bg-white/20"
        >
          <Settings className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<Link href="/settings/team">Team</Link>} />
          <DropdownMenuItem
            render={<Link href="/settings/templates">Templates</Link>}
          />
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
