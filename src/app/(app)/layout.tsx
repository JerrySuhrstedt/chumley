import { redirect } from "next/navigation";
import { Topbar } from "@/components/topbar";
import { getCurrentOrg } from "@/lib/org";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const current = await getCurrentOrg();

  if (!current) {
    redirect("/onboarding");
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      <Topbar orgName={current.org.name} />
      <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
