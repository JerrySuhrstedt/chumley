import { FACTS, SITE_URL } from "./facts";

/**
 * Structured data (schema.org / JSON-LD).
 *
 * This is the machine-readable version of the page: what Google reads to
 * consider a rich result, and what the AI answer engines read as fact. It is
 * rendered as a script tag the browser ignores and crawlers parse.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // The content is our own, built from FACTS, never user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** The product itself, with its price. */
export function softwareApplicationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: FACTS.name,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "CRM",
    operatingSystem: "Web, iOS, Android (browser-based)",
    description: FACTS.summary,
    url: SITE_URL,
    offers: {
      "@type": "Offer",
      price: String(FACTS.price),
      priceCurrency: FACTS.currency,
      description: `$${FACTS.price} per user per month, ${FACTS.trialDays}-day free trial`,
    },
    publisher: { "@type": "Organization", name: FACTS.legalName },
  };
}

/** The company behind it. */
export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: FACTS.name,
    legalName: FACTS.legalName,
    url: SITE_URL,
    description: FACTS.tagline,
  };
}

/** A frequently-asked-questions block, so answers can show in search and AI. */
export function faqPageLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** The trail of where a page sits, for breadcrumb rich results. */
export function breadcrumbLd(crumbs: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.path}`,
    })),
  };
}

/** A guide article. */
export function articleLd({
  headline,
  description,
  path,
}: {
  headline: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    url: `${SITE_URL}${path}`,
    author: { "@type": "Organization", name: FACTS.name },
    publisher: { "@type": "Organization", name: FACTS.legalName },
  };
}
