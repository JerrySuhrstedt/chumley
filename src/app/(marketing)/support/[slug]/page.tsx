import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageMeta } from "@/lib/seo/meta";
import { JsonLd, breadcrumbLd, articleLd } from "@/lib/seo/jsonld";
import {
  Breadcrumbs,
  PageHero,
  Section,
  H2,
  CompareTable,
  CtaClose,
  RelatedLinks,
} from "../../_components/page-kit";
import { ARTICLES, articleBySlug } from "../_articles";

/**
 * An article is its own script, rendered.
 *
 * The body copy here is the `say` strings in order and nothing else, so what
 * is on the page and what gets read to camera cannot drift apart. The only
 * things the page adds are headings and the link furniture, which a video
 * expresses as chapter markers instead.
 */

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = articleBySlug(slug);
  if (!article) return {};
  return pageMeta({
    title: article.title,
    description: article.description,
    path: `/support/${article.slug}`,
  });
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = articleBySlug(slug);
  if (!article) notFound();

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Support", path: "/support" },
    { name: article.title, path: `/support/${article.slug}` },
  ];

  const related = (article.related ?? [])
    .map(articleBySlug)
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <JsonLd
        data={articleLd({
          headline: article.title,
          description: article.description,
          path: `/support/${article.slug}`,
        })}
      />

      <Breadcrumbs crumbs={crumbs} />
      <PageHero
        eyebrow={`${article.topic} · ${article.minutes} min`}
        title={article.title}
        sub={article.hook}
      />

      {article.beats.map((beat, i) => (
        <Section key={beat.title} alt={i % 2 === 1}>
          <H2>{beat.title}</H2>
          {beat.say.map((line, j) => (
            <p
              key={j}
              className="mt-4 text-[17px] leading-relaxed text-[var(--ink-soft)]"
            >
              {line}
            </p>
          ))}
          {beat.table && (
            <div className="mt-6">
              <CompareTable columns={beat.table.columns} rows={beat.table.rows} />
            </div>
          )}
        </Section>
      ))}

      <Section alt={article.beats.length % 2 === 1}>
        <div className="rounded-2xl border-l-4 border-[var(--brand)] bg-[var(--brand-tint)] px-6 py-6">
          <h2 className="text-xl font-extrabold tracking-tight text-[var(--ink)]">
            {article.gotcha.title}
          </h2>
          {article.gotcha.say.map((line, j) => (
            <p
              key={j}
              className="mt-3 text-[17px] leading-relaxed text-[var(--ink-soft)]"
            >
              {line}
            </p>
          ))}
        </div>
        <p className="mt-8 text-[17px] leading-relaxed text-[var(--ink-soft)]">
          {article.outro}
        </p>
      </Section>

      <div className="mx-auto max-w-3xl px-5 pt-4">
        <p className="text-[15px] text-[var(--ink-muted)]">
          <Link
            href={`/support/${article.slug}/script`}
            className="font-semibold text-[var(--brand)] hover:underline"
          >
            Read it as a script
          </Link>
          {" · "}Still stuck?{" "}
          <Link href="/support" className="font-semibold text-[var(--brand)] hover:underline">
            Ask us
          </Link>{" "}
          and we will come back to you the same day.
        </p>
      </div>

      {related.length > 0 && (
        <RelatedLinks
          links={related.map((a) => ({ title: a.title, path: `/support/${a.slug}` }))}
        />
      )}

      <CtaClose
        heading="Not using Chumley yet?"
        sub="14 days free, and we do not ask for a card."
      />
    </>
  );
}
