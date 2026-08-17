import { redirect } from "next/navigation";
import { getCurrentOrg, getCurrentUser } from "@/lib/org";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const existing = await getCurrentOrg();
  if (existing) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm rounded-lg border border-neutral-800 bg-neutral-900 p-8">
        <h1 className="mb-1 text-xl font-semibold text-neutral-50">
          Name your sales team
        </h1>
        <p className="mb-6 text-sm text-neutral-400">
          You can invite the rest of your team once you&apos;re in.
        </p>
        <OnboardingForm />
      </div>
    </main>
  );
}
