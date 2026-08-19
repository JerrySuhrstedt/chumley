import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { signOut } from "@/app/(app)/actions";
import { getCurrentOrg, getCurrentUser } from "@/lib/org";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const existing = await getCurrentOrg();
  if (existing) {
    redirect("/pipeline");
  }

  return (
    <AuthShell>
      <h1 className="text-center text-2xl font-semibold text-slate-800">
        Name your sales team
      </h1>
      <p className="mt-1 text-center text-sm text-slate-600">
        You can invite the rest of your team once you&apos;re in.
      </p>

      {/* Somebody who already has a team and signed in with a second
          address would otherwise create an empty one without noticing.
          Naming the account is the only warning that costs nothing. */}
      <div className="mt-5 rounded-md bg-slate-50 px-3 py-2.5 text-center">
        <p className="text-sm text-slate-700">
          Signed in as <strong className="font-semibold">{user.email}</strong>
        </p>
        <form action={signOut}>
          <button
            type="submit"
            className="mt-0.5 text-xs font-medium text-[var(--board-bg)] hover:underline"
          >
            Not the right account? Sign out
          </button>
        </form>
      </div>

      <OnboardingForm />
    </AuthShell>
  );
}
