import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { pageMeta } from "@/lib/seo/meta";
import { JsonLd, breadcrumbLd } from "@/lib/seo/jsonld";
import {
  Breadcrumbs,
  PageHero,
  Section,
} from "@/app/(marketing)/_components/page-kit";

export const metadata: Metadata = pageMeta({
  title: "Guides",
  description:
    "Plain-language guides on how to keep track of sales leads, work a follow-up list, and run your sales day from your phone. No jargon, real advice you can use today.",
  path: "/guides",
});

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Guides", path: "/guides" },
];

const GUIDES = [
  {
    title: "How to Keep Track of Sales Leads Without Losing Half of Them",
    sub: "The real reasons leads slip through the cracks, and the simple system that stops it.",
    path: "/guides/how-to-keep-track-of-sales-leads",
  },
  {
    title: "The Simplest Way to Track Sales Follow-Ups From Your Phone",
    sub: "Follow-up is where deals are won and lost. Here is how to work a follow-up list that actually gets worked.",
    path: "/guides/sales-follow-up-app",
  },
  {
    title: "How to Run Your Whole Sales Day From Your Phone",
    sub: "Log a call from the truck in ten seconds, tap to call or text, and skip the desktop CRM you never open.",
    path: "/guides/run-your-sales-day-from-your-phone",
  },
  {
    title: "Keeping Track of Customers Without a Spreadsheet or a Rolodex",
    sub: "The difference between a contact list and a live pipeline, and how to keep cold names out of your active deals.",
    path: "/guides/keep-track-of-customers-without-a-spreadsheet",
  },
  {
    title: "When a Spreadsheet Stops Working for Sales, and What Replaces It",
    sub: "When a spreadsheet is fine, the exact signs it has stopped working, and how to switch in an afternoon.",
    path: "/guides/replace-spreadsheet-with-crm",
  },
  {
    title: "Why Most Reps Quit Their CRM in the First Month",
    sub: "Too many required fields, built for managers not sellers, slow on a phone. What a CRM a rep will keep looks like.",
    path: "/guides/why-reps-quit-their-crm",
  },
];

export default function GuidesHubPage() {
  return (
    <>
      <JsonLd data={breadcrumbLd(CRUMBS)} />

      <Breadcrumbs crumbs={CRUMBS} />
      <PageHero
        eyebrow="Guides"
        title="Plain guides on tracking leads and follow-ups"
        sub="No jargon, no theory. Just how to keep track of your sales, work your follow-ups, and run the day from your phone. Written for the person doing the selling."
        cta={false}
      />

      <Section>
        <ul className="flex flex-col divide-y divide-[var(--rule)] rounded-2xl border border-[var(--rule)] bg-white">
          {GUIDES.map((g) => (
            <li key={g.path}>
              <Link
                href={g.path}
                className="flex items-center justify-between gap-4 px-5 py-5 hover:bg-[var(--surface-alt)]"
              >
                <span>
                  <span className="block font-bold text-[var(--ink)]">
                    {g.title}
                  </span>
                  <span className="mt-1 block text-[15px] leading-snug text-[var(--ink-soft)]">
                    {g.sub}
                  </span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-[var(--ink-muted)]" />
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
