import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
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
      <OnboardingForm />
    </AuthShell>
  );
}
