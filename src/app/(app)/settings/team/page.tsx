import { headers } from "next/headers";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { memberships } from "@/db/schema";
import { authUsers } from "@/db/auth-schema";
import { getCurrentOrg } from "@/lib/org";
import { CopyLinkButton } from "../copy-link-button";
import { getOrCreateInviteToken } from "./actions";
import { RemoveMemberButton } from "./remove-member-button";

export default async function TeamSettingsPage() {
  const current = await getCurrentOrg();
  if (!current) return null;

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
    headers().then((h) => h.get("origin")),
  ]);

  const inviteUrl = `${origin}/join/${token}`;
  const webhookUrl = `${origin}/api/webhooks/leads/${current.org.webhookToken}`;

  return (
    <div className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6">
      <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Link
        href="/"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to pipeline
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Invite teammates</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <code className="flex-1 truncate rounded bg-muted px-2 py-1.5 text-xs">
            {inviteUrl}
          </code>
          <CopyLinkButton url={inviteUrl} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook (Zapier, Make, website forms)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            POST JSON (<code>name</code>, <code>email</code>, <code>phone</code>,{" "}
            <code>company</code>, <code>value</code>) to this URL to create a lead.
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
                <p className="text-xs capitalize text-muted-foreground">
                  {member.role}
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
