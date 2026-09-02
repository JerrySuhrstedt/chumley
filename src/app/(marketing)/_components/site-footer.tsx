import Link from "next/link";
import { ChumleyLogo } from "@/components/chumley-logo";
import { COMPANY, MERCHANT } from "./legal";

const PRODUCT = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#benefits", label: "Benefits" },
  { href: "#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "#faqs", label: "FAQs" },
];

const COMPANY_LINKS = [
  { href: "/login", label: "Log in" },
  { href: "/login?mode=signup", label: "Create an account" },
  { href: "/support", label: "Support" },
  { href: "mailto:info@sumolab.co", label: "Contact" },
];

const LEGAL = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/refunds", label: "Refund Policy" },
];

const FOR = [
  { href: "/for/solo-sales-reps", label: "Solo reps & teams of one" },
  { href: "/for/independent-sales-reps", label: "Independent & 1099 reps" },
  { href: "/for/small-sales-teams", label: "Small sales teams" },
  { href: "/for/contractors", label: "Contractors" },
  { href: "/for/wedding-vendors", label: "Wedding vendors" },
  { href: "/for/djs", label: "Mobile DJs" },
];

const COMPARE = [
  { href: "/compare/less-annoying-crm", label: "vs Less Annoying CRM" },
  { href: "/compare/pipedrive", label: "vs Pipedrive" },
  { href: "/compare/onepagecrm", label: "vs OnePageCRM" },
];

const HELP = [
  { href: "/support", label: "Support & help center" },
  { href: "/support/how-calling-works", label: "How calling works" },
  { href: "/support/add-your-first-lead", label: "Add your first lead" },
  { href: "/support/import-leads-from-a-spreadsheet", label: "Import a spreadsheet" },
];

const GUIDES = [
  { href: "/guides", label: "All guides" },
  { href: "/guides/how-to-keep-track-of-sales-leads", label: "Keep track of sales leads" },
  { href: "/guides/sales-follow-up-app", label: "Sales follow-ups" },
  { href: "/guides/replace-spreadsheet-with-crm", label: "Replace a spreadsheet" },
];

export function SiteFooter() {
  return (
    <footer className="bg-[var(--deep)] text-white">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <ChumleyLogo variant="light" className="h-7 w-auto" />
            <p className="mt-4 text-[15px] leading-relaxed text-white/70">
              Nothing to set up, nothing to learn. The sales CRM built for
              people who would rather be selling than typing.
            </p>

            {/* Email stays: Paddle is the merchant of record, so the card
                networks' find-who-charged-you duty is theirs, but a buyer
                should still be able to reach a human without hunting. */}
            <address className="mt-5 text-[15px] leading-relaxed text-white/70 not-italic">
              <span className="font-semibold text-white/90">
                {COMPANY.legalName}
              </span>
              <br />
              <a
                href={`mailto:${COMPANY.email}`}
                className="transition-colors hover:text-[var(--brand)]"
              >
                {COMPANY.email}
              </a>
              <br />
              Developed in Chandler, Arizona, USA
            </address>
          </div>

          <div className="flex gap-14 sm:gap-20">
            <div>
              <h3 className="text-xs font-bold tracking-widest text-white/50 uppercase">
                Product
              </h3>
              <ul className="mt-4 space-y-3">
                {PRODUCT.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className="text-[15px] text-white/80 transition-colors hover:text-[var(--brand)]"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold tracking-widest text-white/50 uppercase">
                Company
              </h3>
              <ul className="mt-4 space-y-3">
                {COMPANY_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-[15px] text-white/80 transition-colors hover:text-[var(--brand)]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold tracking-widest text-white/50 uppercase">
                Legal
              </h3>
              <ul className="mt-4 space-y-3">
                {LEGAL.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-[15px] text-white/80 transition-colors hover:text-[var(--brand)]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Site-wide links to the use-case, comparison and guide pages, so
          every one is reachable and passes a little authority from every
          page it appears on. */}
      <div className="border-t border-white/10">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-5 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {[
            { title: "Who it's for", links: FOR },
            { title: "Compare", links: COMPARE },
            { title: "Guides", links: GUIDES },
            { title: "Help", links: HELP },
          ].map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-bold tracking-widest text-white/50 uppercase">
                {group.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {group.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-[15px] text-white/80 transition-colors hover:text-[var(--brand)]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-5 lg:px-8">
          {/* Required disclosure: Paddle, not us, is the seller of record. */}
          <p className="text-center text-sm text-white/50">
            Our order process is conducted by our online reseller{" "}
            {MERCHANT.name}, the merchant of record for all our orders. Your
            statement will show {MERCHANT.statement}.
          </p>
          <p className="mt-2 text-center text-sm text-white/50">
            © {new Date().getFullYear()} {COMPANY.legalName} | All rights
            reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
