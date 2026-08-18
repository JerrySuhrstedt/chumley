import Link from "next/link";
import { Sell1Logo } from "@/components/sell1-logo";

const PRODUCT = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#benefits", label: "Benefits" },
  { href: "#features", label: "Features" },
  { href: "#faqs", label: "FAQs" },
];

const COMPANY = [
  { href: "/login", label: "Log in" },
  { href: "/login?mode=signup", label: "Create an account" },
  { href: "mailto:info@sumolab.co", label: "Contact" },
];

const LEGAL = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
];

export function SiteFooter() {
  return (
    <footer className="bg-[var(--deep)] text-white">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <Sell1Logo variant="light" className="h-7 w-auto" />
            <p className="mt-4 text-[15px] leading-relaxed text-white/70">
              Nothing to set up, nothing to learn. The sales CRM built for
              people who would rather be selling than typing.
            </p>
            <a
              href="mailto:info@sumolab.co"
              className="mt-4 block text-[15px] text-white/70 transition-colors hover:text-[var(--brand)]"
            >
              info@sumolab.co
            </a>
            <a
              href="tel:+14808269400"
              className="block text-[15px] text-white/70 transition-colors hover:text-[var(--brand)]"
            >
              (480) 826-9400
            </a>
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
                {COMPANY.map((l) => (
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

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-5 lg:px-8">
          <p className="text-center text-sm text-white/50">
            © {new Date().getFullYear()} SumoLab LLC | All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
