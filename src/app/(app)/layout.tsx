import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { Topbar } from "@/components/topbar";
import { getCurrentOrg } from "@/lib/org";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const current = await getCurrentOrg();

  if (!current) {
    redirect("/onboarding");
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar email={current.email} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          orgName={current.org.name}
          displayName={current.displayName}
          jobTitle={current.jobTitle}
          email={current.email}
        />
        <main className="flex flex-1 flex-col overflow-hidden bg-[var(--board-bg)]">
          {children}
        </main>
      </div>
    </div>
  );
}
