import { SiteFooter } from "./_components/site-footer";
import { SiteHeader } from "./_components/site-header";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-col bg-white text-[var(--ink)]">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
