import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/db";
import { memberships, organizations } from "@/db/schema";
import { getCurrentOrg } from "@/lib/org";
import { normalizeLinkedinUrl } from "@/lib/linkedin";
import { getProviderPhotos } from "@/lib/provider-photos";
import { HeadshotPicker } from "./headshot-picker";

/** Lucide dropped brand marks, so the LinkedIn glyph is inlined. */
function LinkedinMark({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="#0a66c2" aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

async function saveProfile(formData: FormData) {
  "use server";

  const current = await getCurrentOrg();
  if (!current) return;

  const text = (key: string) => {
    const value = String(formData.get(key) ?? "").trim();
    return value.length > 0 ? value : null;
  };

  // Store a tidy canonical URL rather than whatever was pasted. An
  // unrecognisable value is dropped instead of saved as junk.
  const linkedinRaw = text("linkedinUrl");
  const linkedinUrl = linkedinRaw ? normalizeLinkedinUrl(linkedinRaw) : null;

  await db
    .update(memberships)
    .set({
      displayName: text("displayName"),
      jobTitle: text("jobTitle"),
      linkedinUrl,
      avatarUrl: text("avatarUrl"),
    })
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

  // The header shows the name and the board shows the avatar, so both
  // re-render, and Settings answers with a visible "saved" instead of
  // this page silently swallowing the click.
  revalidatePath("/", "layout");
  redirect("/settings?saved=profile");
}

export default async function ProfileSettingsPage() {
  const current = await getCurrentOrg();
  if (!current) return null;

  const providerPhotos = await getProviderPhotos(current.userId);

  const initial = (current.displayName ?? current.email ?? "?")
    .charAt(0)
    .toUpperCase();

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
          <HeadshotPicker
            savedUrl={current.savedAvatarUrl}
            providerPhotos={providerPhotos}
            initial={initial}
          />

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
            <Label htmlFor="linkedinUrl" className="flex items-center gap-1.5">
              <LinkedinMark />
              LinkedIn profile
            </Label>
            <Input
              id="linkedinUrl"
              name="linkedinUrl"
              type="url"
              inputMode="url"
              defaultValue={current.linkedinUrl ?? ""}
              placeholder="linkedin.com/in/your-handle"
            />
            <p className="text-xs text-slate-500">
              Paste the whole link or just the handle. LinkedIn does not let
              other sites read a profile photo from a URL, so your headshot
              comes from the picker above or from the account you sign in with.
            </p>
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
