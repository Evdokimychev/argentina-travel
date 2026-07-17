import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import KbBreadcrumbs from "@/components/knowledge-base/KbBreadcrumbs";
import KbCallout from "@/components/knowledge-base/KbCallout";
import KbEditorialNotice from "@/components/knowledge-base/KbEditorialNotice";
import KbFactPanel from "@/components/knowledge-base/KbFactPanel";
import KbRelated from "@/components/knowledge-base/KbRelated";
import KbSideNav from "@/components/knowledge-base/KbSideNav";
import KbSources from "@/components/knowledge-base/KbSources";
import KbToc from "@/components/knowledge-base/KbToc";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import ContentArticleJsonLd from "@/components/seo/ContentArticleJsonLd";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import {
  getAllEntryIds,
  getBreadcrumbs,
  getEntrySection,
  getRelated,
  getSectionNeighbours,
} from "@/lib/knowledge-base/content";
import {
  listPublishedKnowledgeSlugs,
  resolveKnowledgeEntry,
} from "@/lib/cms/knowledge-resolver";
import { buildCmsContentHreflangAlternates } from "@/lib/cms/cms-hreflang";
import { cmsFallbackRobots } from "@/lib/cms/content-resolver";
import { buildKbEntryArticleJsonLd } from "@/lib/content-json-ld";
import SocialFeed from "@/components/social-feed/SocialFeed";
import { kbCrumbsToJsonLdItems } from "@/lib/knowledge-base/kb-breadcrumbs-json-ld";
import { kbTypeLabel } from "@/lib/knowledge-base/labels";
import { extractHeadings, renderMarkdown } from "@/lib/knowledge-base/markdown";
import type { KbEntry } from "@/lib/knowledge-base/types";
import { entryHref } from "@/lib/knowledge-base/urls";
import { capBuildStaticParams } from "@/lib/build-static-limits";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 86_400;
export const dynamicParams = true;

export async function generateStaticParams() {
  return capBuildStaticParams(await listPublishedKnowledgeSlugs()).map((id) => ({ slug: id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = await resolveKnowledgeEntry(slug);
  if (!entry) return {};
  const pageTitle = `${entry.title} — База знаний`;
  const description = entry.summary?.trim() || entry.title;
  const metadata = buildPublicPageMetadata({
    title: pageTitle,
    description,
    path: `/baza-znaniy/${entry.id}`,
  });
  return {
    ...metadata,
    alternates: await buildCmsContentHreflangAlternates("knowledge", entry.id),
    ...(cmsFallbackRobots(entry) ? { robots: cmsFallbackRobots(entry) } : {}),
  };
}

const CONFIDENCE_STYLE: Record<string, string> = {
  high: "bg-success-muted text-success",
  medium: "bg-warning-muted text-warning",
  low: "bg-surface-muted text-slate",
};

function imageCredit(hero: NonNullable<KbEntry["media"]>["hero"]) {
  if (!hero) return null;
  const parts = [hero.author, hero.license].filter(Boolean);
  if (parts.length === 0 && !hero.source_page) return null;
  const label = parts.join(", ") || "Источник изображения";
  if (!hero.source_page) return label;
  return (
    <a
      href={hero.source_page}
      target="_blank"
      rel="noopener noreferrer"
      className="underline decoration-slate/30 underline-offset-2 hover:decoration-slate"
    >
      {label}
    </a>
  );
}

export default async function KnowledgeArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const entry = await resolveKnowledgeEntry(slug);
  if (!entry) notFound();

  const validIds = new Set([...getAllEntryIds(), entry.id]);
  const headings = extractHeadings(entry.body);
  const related = getRelated(entry, 6);
  const { prev, next } = getSectionNeighbours(entry);
  const section = getEntrySection(entry);
  const hero = entry.media?.hero;

  return (
    <>
      <BreadcrumbListJsonLd items={kbCrumbsToJsonLdItems(getBreadcrumbs(entry))} />
      <WebPageJsonLd
        name={entry.title}
        description={entry.summary?.trim() || entry.title}
        path={`/baza-znaniy/${entry.id}`}
      />
      <ContentArticleJsonLd data={buildKbEntryArticleJsonLd(entry)} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <KbBreadcrumbs items={getBreadcrumbs(entry)} />

        <div className="mt-5 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[15rem_minmax(0,1fr)_14rem]">
          {/* Постоянная навигация базы знаний */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <KbSideNav sectionId={section?.id} currentEntryId={entry.id} />
            </div>
          </aside>

          {/* Основная колонка (ограниченная ширина для комфортного чтения) */}
          <article className="min-w-0 max-w-[46rem]">
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
              {entry.status === "stub" && (
                <span className="inline-flex items-center rounded-full bg-surface-muted px-2.5 py-0.5 text-2xs font-medium text-slate">
                  Короткая справка
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

            <KbEditorialNotice entry={entry} />

            {hero && (
              <figure className="mt-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={hero.url}
                  alt={hero.alt ?? entry.title}
                  loading="lazy"
                  className="aspect-[16/9] w-full rounded-panel bg-surface-muted object-cover"
                />
                {imageCredit(hero) && (
                  <figcaption className="mt-1.5 text-xs leading-relaxed text-slate">
                    Фото: {imageCredit(hero)}
                  </figcaption>
                )}
              </figure>
            )}

            <KbFactPanel entry={entry} />

            {/* Оглавление на мобильных и планшетах — над телом */}
            {headings.length >= 3 && (
              <div className="mt-6 rounded-panel border border-border-subtle bg-surface-muted p-4 xl:hidden">
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

            <SocialFeed placement={`kb:${entry.id}`} compact />
          </article>

          {/* Оглавление — липкая правая колонка на широких экранах */}
          {headings.length >= 3 && (
            <aside className="hidden xl:block">
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
