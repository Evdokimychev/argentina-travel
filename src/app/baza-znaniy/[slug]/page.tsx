import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import KbBreadcrumbs from "@/components/knowledge-base/KbBreadcrumbs";
import KbCallout from "@/components/knowledge-base/KbCallout";
import KbRelated from "@/components/knowledge-base/KbRelated";
import KbSources from "@/components/knowledge-base/KbSources";
import KbToc from "@/components/knowledge-base/KbToc";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import {
  getAllEntryIds,
  getBreadcrumbs,
  getEntry,
  getRelated,
  getSectionNeighbours,
} from "@/lib/knowledge-base/content";
import { kbCrumbsToJsonLdItems } from "@/lib/knowledge-base/kb-breadcrumbs-json-ld";
import { kbTypeLabel } from "@/lib/knowledge-base/labels";
import { extractHeadings, renderMarkdown } from "@/lib/knowledge-base/markdown";
import { entryHref } from "@/lib/knowledge-base/urls";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllEntryIds().map((id) => ({ slug: id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = getEntry(slug);
  if (!entry) return {};
  const pageTitle = `${entry.title} — База знаний`;
  const description = entry.summary?.trim() || entry.title;
  return buildPublicPageMetadata({
    title: pageTitle,
    description,
    path: `/baza-znaniy/${entry.id}`,
  });
}

const CONFIDENCE_STYLE: Record<string, string> = {
  high: "bg-success-muted text-success",
  medium: "bg-warning-muted text-warning",
  low: "bg-surface-muted text-slate",
};

export default async function KnowledgeArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const entry = getEntry(slug);
  if (!entry) notFound();

  const validIds = new Set(getAllEntryIds());
  const headings = extractHeadings(entry.body);
  const related = getRelated(entry, 6);
  const { prev, next } = getSectionNeighbours(entry);
  const hero = entry.media?.hero;

  return (
    <>
      <BreadcrumbListJsonLd items={kbCrumbsToJsonLdItems(getBreadcrumbs(entry))} />
      <WebPageJsonLd
        name={entry.title}
        description={entry.summary?.trim() || entry.title}
        path={`/baza-znaniy/${entry.id}`}
      />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <KbBreadcrumbs items={getBreadcrumbs(entry)} />

      <div className="mt-5 lg:grid lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-10">
        {/* Основная колонка */}
        <article className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-surface-muted px-2.5 py-0.5 text-2xs font-medium uppercase tracking-wide text-slate">
              {kbTypeLabel(entry.type)}
            </span>
            {entry.confidence && (
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-2xs font-medium ${
                  CONFIDENCE_STYLE[entry.confidence] ?? "bg-surface-muted text-slate"
                }`}
              >
                {entry.confidence === "high"
                  ? "Проверено"
                  : entry.confidence === "medium"
                    ? "Проверяйте актуальность"
                    : "Ориентировочно"}
              </span>
            )}
            {entry.last_verified && (
              <span className="text-2xs text-slate">
                Обновлено: {entry.last_verified}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
            {entry.title}
          </h1>
          {entry.summary && (
            <p className="mt-3 text-lg leading-relaxed text-muted">
              {entry.summary}
            </p>
          )}

          {hero && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hero.url}
              alt={hero.alt ?? entry.title}
              loading="lazy"
              className="mt-6 aspect-[16/9] w-full rounded-panel object-cover"
            />
          )}

          {/* Оглавление на мобильных — над телом */}
          {headings.length >= 3 && (
            <div className="mt-6 rounded-panel border border-border-subtle bg-surface-muted p-4 lg:hidden">
              <KbToc headings={headings} />
            </div>
          )}

          <KbCallout variant="warning" items={entry.warnings} />
          <KbCallout variant="recommendation" items={entry.recommendations} />

          <div className="mt-4 text-base">
            {renderMarkdown(entry.body, { validIds })}
          </div>

          <KbSources sources={entry.sources} />

          {/* Пред/след внутри раздела */}
          {(prev || next) && (
            <nav className="mt-8 flex flex-col gap-3 border-t border-border-subtle pt-5 sm:flex-row sm:justify-between">
              {prev ? (
                <Link
                  href={entryHref(prev.id)}
                  className="group flex-1 rounded-card border border-border-subtle bg-surface-elevated p-3 text-sm shadow-card hover:border-sky/40"
                >
                  <span className="text-2xs uppercase tracking-wide text-slate">
                    ← Предыдущая
                  </span>
                  <span className="mt-0.5 block font-medium text-foreground group-hover:text-sky-ink">
                    {prev.title}
                  </span>
                </Link>
              ) : (
                <span className="flex-1" />
              )}
              {next && (
                <Link
                  href={entryHref(next.id)}
                  className="group flex-1 rounded-card border border-border-subtle bg-surface-elevated p-3 text-right text-sm shadow-card hover:border-sky/40"
                >
                  <span className="text-2xs uppercase tracking-wide text-slate">
                    Следующая →
                  </span>
                  <span className="mt-0.5 block font-medium text-foreground group-hover:text-sky-ink">
                    {next.title}
                  </span>
                </Link>
              )}
            </nav>
          )}

          <KbRelated entries={related} />
        </article>

        {/* Оглавление — липкая колонка на десктопе */}
        {headings.length >= 3 && (
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <KbToc headings={headings} />
            </div>
          </aside>
        )}
      </div>
    </div>
    </>
  );
}
