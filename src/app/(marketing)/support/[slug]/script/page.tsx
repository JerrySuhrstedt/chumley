import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTICLES, articleBySlug } from "../../_articles";

/**
 * The same article with the furniture taken off, for reading to camera.
 *
 * This exists because a help page read aloud sounds like a help page being
 * read aloud. The words are identical either way, since both views render
 * the same `say` strings, but here they run continuously with the headings
 * demoted to cue marks, which is what a script actually needs.
 *
 * noindex: it is a duplicate of the article by design, and asking Google to
 * choose between two copies of the same words is how both of them lose.
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
  return {
    title: article ? `Script: ${article.title}` : "Script",
    robots: { index: false, follow: false },
  };
}

/** A cue is a heading in the article and a chapter marker in the video. */
function Cue({ children }: { children: string }) {
  return (
    <p className="mt-10 mb-1 text-xs font-bold uppercase tracking-widest text-[var(--ink-muted)]">
      {children}
    </p>
  );
}

function Say({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((line, i) => (
        <p key={i} className="mt-4 text-[19px] leading-[1.75] text-[var(--ink)]">
          {line}
        </p>
      ))}
    </>
  );
}

export default async function ScriptPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = articleBySlug(slug);
  if (!article) notFound();

  const words = [
    article.hook,
    ...article.beats.flatMap((b) => b.say),
    ...article.gotcha.say,
    article.outro,
  ]
    .join(" ")
    .split(/\s+/).length;

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <div className="flex items-baseline justify-between gap-4 border-b border-[var(--rule)] pb-5">
        <Link
          href={`/support/${article.slug}`}
          className="text-sm font-semibold text-[var(--brand)] hover:underline"
        >
          Back to the article
        </Link>
        <span className="text-sm text-[var(--ink-muted)]">
          {words} words · about {article.minutes} min
        </span>
      </div>

      <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-balance text-[var(--ink)]">
        {article.title}
      </h1>

      <Cue>Open</Cue>
      <Say lines={[article.hook]} />

      {article.beats.map((beat) => (
        <div key={beat.title}>
          <Cue>{beat.title}</Cue>
          <Say lines={beat.say} />
          {(beat.table || beat.image) && (
            <p className="mt-4 rounded-xl border border-dashed border-[var(--rule)] px-4 py-3 text-[15px] text-[var(--ink-muted)]">
              {beat.image
                ? `On screen: ${beat.image.src.split("/").pop()}. Hold it while you read the lines above.`
                : "On screen: the comparison table from the article. Hold it while you read the lines above."}
            </p>
          )}
        </div>
      ))}

      <Cue>{article.gotcha.title}</Cue>
      <Say lines={article.gotcha.say} />

      <Cue>Close</Cue>
      <Say lines={[article.outro]} />
    </div>
  );
}
