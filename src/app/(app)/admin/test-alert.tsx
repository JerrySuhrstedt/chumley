"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { BellRing } from "lucide-react";
import { adminSendTestAlert } from "./actions";

/** Proves the alert path end to end, rather than assuming it. */
export function TestAlertButton() {
  const [working, start] = useTransition();
  return (
    <button
      type="button"
      disabled={working}
      onClick={() =>
        start(async () => {
          const r = await adminSendTestAlert();
          if (r.error) toast.error(r.error);
          else toast.success(r.message ?? "Sent.");
        })
      }
      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
    >
      <BellRing className="size-3.5" />
      {working ? "Sending..." : "Send test alert"}
    </button>
  );
}
