import { GoogleAnalytics } from "@next/third-parties/google";
import { SiteFooter } from "./_components/site-footer";
import { SiteHeader } from "./_components/site-header";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-col bg-white text-[var(--ink)]">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      {/* Marketing pages only, on purpose: visitor and campaign data
          without streaming customers' in-app clicks to Google. The id is
          public by nature (it ships in the page source regardless). */}
      <GoogleAnalytics gaId="G-KSGS12S02W" />
    </div>
  );
}
