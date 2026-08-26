import { getOrigin } from "@/lib/site-url";
import { getBillingState } from "@/lib/paddle/access";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { memberships } from "@/db/schema";
import { users as authUsers } from "@/db/auth-schema";
import { getCurrentOrg } from "@/lib/org";
import { CopyLinkButton } from "../copy-link-button";
import { getOrCreateInviteToken } from "./actions";
import { RemoveMemberButton } from "./remove-member-button";

export default async function TeamSettingsPage() {
  const current = await getCurrentOrg();
  if (!current) return null;

  const billing = await getBillingState(current.org.id);

  const [members, token, origin] = await Promise.all([
    db
      .select({
        id: memberships.id,
        userId: memberships.userId,
        role: memberships.role,
        email: authUsers.email,
      })
      .from(memberships)
      .leftJoin(authUsers, eq(memberships.userId, authUsers.id))
      .where(eq(memberships.orgId, current.org.id)),
    getOrCreateInviteToken(),
    getOrigin(),
  ]);

  const inviteUrl = `${origin}/join/${token}`;
  const webhookUrl = `${origin}/api/webhooks/leads/${current.org.webhookToken}`;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
      <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Link
        href="/settings"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to settings
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Invite teammates</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {Number.isFinite(billing.seatsLeft) && (
            <p className="text-sm text-muted-foreground">
              {billing.seatsUsed} of {billing.seats} seats used.{" "}
              {billing.seatsLeft > 0 ? (
                <span className="font-medium text-foreground">
                  {billing.seatsLeft} left.
                </span>
              ) : (
                <span className="font-medium text-foreground">
                  No seats left.
                </span>
              )}
            </p>
          )}

          {billing.seatsLeft > 0 ? (
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded bg-muted px-2 py-1.5 text-xs">
                {inviteUrl}
              </code>
              <CopyLinkButton url={inviteUrl} />
            </div>
          ) : (
            // Hiding the link is the honest failure. Handing somebody a
            // link that will bounce their teammate is worse than saying so.
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Every seat is taken. Add more seats in{" "}
              <Link href="/settings/billing" className="font-semibold underline">
                Billing
              </Link>{" "}
              and the link comes back.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Send leads here automatically</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Give this address to your website person, or paste it into Zapier
            or Make. Anyone who fills out your contact form shows up on the
            board on their own.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-muted px-2 py-1.5 text-xs">
              {webhookUrl}
            </code>
            <CopyLinkButton url={webhookUrl} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between text-sm"
            >
              <div>
                <p>{member.email ?? member.userId}</p>
                <p className="text-xs text-muted-foreground">
                  {member.role === "owner" ? "Owner" : "Team member"}
                </p>
              </div>
              {current.role === "owner" && member.userId !== current.userId && (
                <RemoveMemberButton membershipId={member.id} />
              )}
            </div>
          ))}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
