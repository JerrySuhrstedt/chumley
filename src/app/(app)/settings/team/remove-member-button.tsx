"use client";

import { Button } from "@/components/ui/button";
import { removeMember } from "./actions";

export function RemoveMemberButton({ membershipId }: { membershipId: string }) {
  return (
    <form
      action={async () => {
        await removeMember(membershipId);
      }}
      onSubmit={(e) => {
        if (!confirm("Remove this person from the team?")) {
          e.preventDefault();
        }
      }}
    >
      <Button type="submit" variant="ghost" size="sm">
        Remove
      </Button>
    </form>
  );
}
