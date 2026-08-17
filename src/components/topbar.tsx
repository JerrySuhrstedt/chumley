import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/(app)/actions";

export function Topbar({ userEmail }: { userEmail: string | null }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-6">
      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search contacts, companies, deals..."
          className="pl-8"
        />
      </div>
      <div className="flex items-center gap-3">
        {userEmail && (
          <span className="text-sm text-muted-foreground">{userEmail}</span>
        )}
        <form action={signOut}>
          <Button type="submit" variant="outline" size="sm">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
