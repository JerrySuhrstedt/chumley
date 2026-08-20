import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { Topbar } from "@/components/topbar";
import { getCurrentOrg } from "@/lib/org";
import { getOnboardingState } from "@/lib/onboarding";
import { isAdmin } from "@/lib/admin";
import { OnboardingChecklist } from "./_onboarding/checklist";
import { StagesProvider } from "./_leads/stages-context";
import { getStages } from "@/lib/stages";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const current = await getCurrentOrg();

  if (!current) {
    redirect("/onboarding");
  }

  const admin = await isAdmin();

  const onboarding = await getOnboardingState(
    current.org.id,
    current.displayName,
  );

  // Seeded on first read, so a team that predates custom buckets gets its
  // board here rather than needing a backfill.
  const stages = await getStages(current.org.id);

  // Pre-fill from whatever the sign-in provider already told us, so most
  // people confirm a name rather than type one.
  const [firstName = "", ...rest] = (current.displayName ?? "").split(" ");

  return (
    <StagesProvider stages={stages}>
      {/* The chrome is one continuous colour: the sidebar and top bar sit
          on it transparently, and the content is a panel resting inside
          that frame. */}
      <div className="flex h-screen w-full overflow-hidden bg-[var(--nav-bg)]">
        <AppSidebar isAdmin={admin} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar
            orgName={current.org.name}
            displayName={current.displayName}
            jobTitle={current.jobTitle}
            avatarUrl={current.avatarUrl}
            email={current.email}
          />
          <main className="flex flex-1 flex-col overflow-hidden rounded-tl-2xl bg-[var(--board-bg)]">
            {children}
          </main>
        </div>

        <OnboardingChecklist
          state={onboarding}
          firstName={firstName}
          lastName={rest.join(" ")}
        />
      </div>
    </StagesProvider>
  );
}
