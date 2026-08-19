import Link from "next/link";
import { ArrowLeft, CreditCard, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentOrg } from "@/lib/org";
import { getBillingState } from "@/lib/paddle/access";

const LABEL: Record<string, string> = {
  active: "Active",
  trialing: "Free trial",
  past_due: "Payment failed",
  paused: "Paused",
  canceled: "Ended",
};

const when = (d: Date | null) =>
  d
    ? d.toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

export default async function BillingSettingsPage() {
  const current = await getCurrentOrg();
  if (!current) return null;

  const billing = await getBillingState(current.org.id);
  const sub = billing.subscription;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <Link
          href="/settings"
          className="flex items-center gap-1 text-sm text-slate-500 hover:underline"
        >
          <ArrowLeft className="size-4" />
          Back to settings
        </Link>

        <div>
          <h1 className="text-xl font-semibold text-slate-900">Billing</h1>
          <p className="text-sm text-slate-500">{current.org.name}</p>
        </div>

        {!billing.billingLive && (
          <Card>
            <CardContent className="flex items-start gap-3 pt-6">
              <CreditCard className="mt-0.5 size-5 shrink-0 text-slate-400" />
              <div>
                <p className="font-medium text-slate-900">
                  Nothing is being charged
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Sell1 is free while in early access. Your team is not
                  limited, nothing expires, and no card is on file.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-4 text-slate-500" />
              People on your team
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-3xl font-bold text-slate-900">
              {billing.seatsUsed}
              {Number.isFinite(billing.seatsLeft) && (
                <span className="text-lg font-medium text-slate-500">
                  {" "}
                  of {billing.seats} seats
                </span>
              )}
            </p>

            {Number.isFinite(billing.seatsLeft) ? (
              <>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[var(--board-bg)]"
                    style={{
                      width: `${Math.min(100, (billing.seatsUsed / Math.max(1, billing.seats)) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-sm text-slate-600">
                  {billing.seatsLeft > 0
                    ? `${billing.seatsLeft} seat${billing.seatsLeft === 1 ? "" : "s"} left. Invite from the Team page.`
                    : "Every seat is taken. Add more to invite anybody else."}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-600">
                Invite as many people as you like while we are in early
                access.
              </p>
            )}
          </CardContent>
        </Card>

        {sub && (
          <Card>
            <CardHeader>
              <CardTitle>Your plan</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Status</span>
                <span className="font-medium text-slate-900">
                  {LABEL[sub.status] ?? sub.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Seats paid for</span>
                <span className="font-medium text-slate-900">
                  {sub.quantity}
                </span>
              </div>
              {billing.trialEndsAt && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Trial ends</span>
                  <span className="font-medium text-slate-900">
                    {when(billing.trialEndsAt)}
                  </span>
                </div>
              )}
              {sub.currentPeriodEnd && !billing.endingAt && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Renews</span>
                  <span className="font-medium text-slate-900">
                    {when(sub.currentPeriodEnd)}
                  </span>
                </div>
              )}

              {billing.endingAt && (
                <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-amber-900">
                  {/* Status is still active until this date. Saying "cancelled"
                      here would be wrong and would look like access is gone. */}
                  Your plan ends on {when(billing.endingAt)}. Everything keeps
                  working until then.
                </p>
              )}

              {sub.status === "past_due" && (
                <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-red-800">
                  The last payment did not go through. Nothing is switched off
                  yet, but please update your card.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
