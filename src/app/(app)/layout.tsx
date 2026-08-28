import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { RefreshOnReturn } from "./_shell/refresh-on-return";
import { Topbar } from "@/components/topbar";
import { getCurrentOrg } from "@/lib/org";
import { getOnboardingState } from "@/lib/onboarding";
import { isAdmin } from "@/lib/admin";
import { OnboardingChecklist } from "./_onboarding/checklist";
import { StagesProvider } from "./_leads/stages-context";
import { PullToRefresh } from "./_shell/pull-to-refresh";
import { Deactivated } from "./_shell/deactivated";
import { ReadOnlyBanner } from "./_shell/read-only-banner";
import { getBillingState } from "@/lib/paddle/access";
import { getStages } from "@/lib/stages";

/**
 * No page in the app is allowed to work on a request for more than a
 * minute. The platform default is five, and during the pooler incident a
 * hung /admin sat the full three hundred seconds before dying, which the
 * browser experienced as the app being frozen. A minute is far beyond
 * any legitimate render and short enough that the error boundary and its
 * Try again button appear while the person is still at the keyboard.
 */
export const maxDuration = 60;

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const current = await getCurrentOrg();

  if (!current) {
    redirect("/onboarding");
  }

  // Before anything else is read or drawn. A switched-off team sees one
  // screen and no navigation, so there is nothing to find a way around.
  if (current.org.deactivatedAt) {
    return <Deactivated teamName={current.org.name} />;
  }

  const admin = await isAdmin();

  const onboarding = await getOnboardingState(
    current.org.id,
    current.displayName,
  );

  // Seeded on first read, so a team that predates custom buckets gets its
  // board here rather than needing a backfill.
  const stages = await getStages(current.org.id);

  // Read for the banner only. The gate itself lives in lib/gate.ts and is
  // applied per action, because a server action never renders this layout
  // and a check that only runs here would stop nothing.
  const billing = await getBillingState(current.org.id);

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
        <RefreshOnReturn />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar
            orgName={current.org.name}
            displayName={current.displayName}
            jobTitle={current.jobTitle}
            avatarUrl={current.avatarUrl}
            email={current.email}
          />
          <main className="flex flex-1 flex-col overflow-hidden rounded-tl-2xl bg-[var(--board-bg)]">
            {billing.readOnly && (
              <ReadOnlyBanner
                reason={billing.subscription ? "plan" : "trial"}
                endedAt={
                  billing.subscription?.currentPeriodEnd ??
                  billing.trialEndsAt
                }
              />
            )}
            <PullToRefresh>{children}</PullToRefresh>
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
