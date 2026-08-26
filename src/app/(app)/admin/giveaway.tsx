"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Dices, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminGrantComp, adminPickRandomForComp } from "./actions";
import { CompDialog } from "./comp-dialog";

type Pick = { orgId: string; name: string; ownerEmail: string | null };

/**
 * Pick somebody at random and give them the product.
 *
 * The draw and the gift are two steps on purpose. A single button that
 * picked and granted in one motion would have no moment in it where a
 * human could look at the name and decide otherwise, and the whole reason
 * to do this by hand rather than by cron is that judgement.
 *
 * Redrawing is free and unlimited, which is worth being honest about:
 * this is a way to find somebody to thank, not a lottery with integrity
 * guarantees. If it ever needs to be provably fair, the draw has to move
 * somewhere the operator cannot re-roll it.
 */
export function Giveaway() {
  const router = useRouter();
  const [pick, setPick] = useState<Pick | null>(null);
  const [granting, setGranting] = useState(false);
  const [drawing, start] = useTransition();

  const draw = () =>
    start(async () => {
      const r = await adminPickRandomForComp();
      if (r.error) {
        toast.error(r.error);
        return;
      }
      setPick(r.pick);
    });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="outline"
        loading={drawing}
        onClick={draw}
        className="gap-2"
      >
        <Dices className="size-4" />
        {pick ? "Draw again" : "Pick someone at random"}
      </Button>

      {pick && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm">
          <span className="font-semibold text-violet-900">{pick.name}</span>
          {pick.ownerEmail && (
            <span className="text-violet-700/80">{pick.ownerEmail}</span>
          )}
          <Button
            size="sm"
            className="ml-1"
            onClick={() => setGranting(true)}
          >
            Give them a free account
          </Button>
          <button
            type="button"
            aria-label="Clear the pick"
            onClick={() => setPick(null)}
            className="rounded p-1 text-violet-500 transition-colors hover:bg-violet-100 hover:text-violet-900"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {pick && (
        <CompDialog
          open={granting}
          onOpenChange={setGranting}
          teamName={pick.name}
          ownerEmail={pick.ownerEmail}
          onGrant={async (reason, days) => {
            const r = await adminGrantComp(pick.orgId, reason, days);
            if (!r.error) router.refresh();
            return r;
          }}
          onGranted={() => setPick(null)}
        />
      )}
    </div>
  );
}
