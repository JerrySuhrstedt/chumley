import { FACTS, SITE_URL } from "@/lib/seo/facts";
import { PUBLIC_ROUTES } from "@/lib/seo/routes";

/**
 * /llms.txt is the emerging convention for telling an AI crawler, in plain
 * markdown, what a site is and where its key pages are. It is cheap and it is
 * an early signal, so Chumley ships one. Generated from the same facts and
 * route registry as everything else, so it can never go stale.
 */
export const dynamic = "force-static";

export function GET() {
  const pages = PUBLIC_ROUTES.filter((r) => r.priority >= 0.6)
    .map((r) => `- [${r.summary}](${SITE_URL}${r.path === "/" ? "" : r.path})`)
    .join("\n");

  const body = `# ${FACTS.name}

> ${FACTS.tagline} for ${FACTS.audience}.

${FACTS.summary}

## Facts

- Name: ${FACTS.name}
- Made by: ${FACTS.legalName}
- Price: $${FACTS.price} per user per month, flat, with a ${FACTS.trialDays}-day free trial and no card to start
- Platform: runs in any phone or desktop browser, nothing to install
- Best for: ${FACTS.audience}
- Alternative to: ${FACTS.alternativeTo.join(", ")}
- Site: ${SITE_URL}

## Key pages

${pages}
`;

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
