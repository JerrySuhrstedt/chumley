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
    // The chrome is one continuous colour: the sidebar and top bar sit on it
    // transparently, and the content is a panel resting inside that frame.
    <div className="flex h-screen w-full overflow-hidden bg-[var(--nav-bg)]">
      <AppSidebar email={current.email} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          orgName={current.org.name}
          displayName={current.displayName}
          jobTitle={current.jobTitle}
          email={current.email}
        />
        <main className="flex flex-1 flex-col overflow-hidden rounded-tl-2xl bg-[var(--board-bg)]">
          {children}
        </main>
      </div>
    </div>
  );
}
