import Link from "next/link";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/db";
import { memberships, organizations } from "@/db/schema";
import { getCurrentOrg } from "@/lib/org";

async function saveProfile(formData: FormData) {
  "use server";

  const current = await getCurrentOrg();
  if (!current) return;

  const text = (key: string) => {
    const value = String(formData.get(key) ?? "").trim();
    return value.length > 0 ? value : null;
  };

  await db
    .update(memberships)
    .set({ displayName: text("displayName"), jobTitle: text("jobTitle") })
    .where(
      and(
        eq(memberships.orgId, current.org.id),
        eq(memberships.userId, current.userId)
      )
    );

  // Only an owner renames the company.
  const orgName = text("orgName");
  if (current.role === "owner" && orgName) {
    await db
      .update(organizations)
      .set({ name: orgName })
      .where(eq(organizations.id, current.org.id));
  }

  revalidatePath("/", "layout");
}

export default async function ProfileSettingsPage() {
  const current = await getCurrentOrg();
  if (!current) return null;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
      <div className="mx-auto flex max-w-lg flex-col gap-4">
        <Link
          href="/settings"
          className="flex items-center gap-1 text-sm text-slate-500 hover:underline"
        >
          <ArrowLeft className="size-4" />
          Back to settings
        </Link>

        <div>
          <h1 className="text-xl font-semibold text-slate-900">Your profile</h1>
          <p className="text-sm text-slate-500">
            Shown in the header at the top of the app.
          </p>
        </div>

        <form
          action={saveProfile}
          className="flex flex-col gap-5 rounded-lg border border-slate-200 bg-white p-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="displayName">Your name</Label>
            <Input
              id="displayName"
              name="displayName"
              defaultValue={current.displayName ?? ""}
              placeholder="Jerry Suhrstedt"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="jobTitle">Job title</Label>
            <Input
              id="jobTitle"
              name="jobTitle"
              defaultValue={current.jobTitle ?? ""}
              placeholder="Sales Manager"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="orgName">Company</Label>
            <Input
              id="orgName"
              name="orgName"
              defaultValue={current.org.name}
              disabled={current.role !== "owner"}
            />
            {current.role !== "owner" && (
              <p className="text-xs text-slate-500">
                Only the team owner can rename the company.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Email</Label>
            <p className="text-sm text-slate-600">{current.email}</p>
          </div>

          <Button type="submit" className="self-start">
            Save
          </Button>
        </form>
      </div>
    </div>
  );
}
