import type { Metadata } from "next";
import { notFound } from "next/navigation";

import KbBreadcrumbs from "@/components/knowledge-base/KbBreadcrumbs";
import KbEntryCard from "@/components/knowledge-base/KbEntryCard";
import KbSearchBox from "@/components/knowledge-base/KbSearchBox";
import KbSideNav from "@/components/knowledge-base/KbSideNav";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import {
  KB_SECTIONS,
  getSectionBySlug,
  getSectionCount,
  getSectionGroups,
} from "@/lib/knowledge-base/content";
import { buildDetailBreadcrumbItems } from "@/lib/detail-breadcrumbs";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return KB_SECTIONS.filter((section) => getSectionCount(section.id) > 0).map((section) => ({
    slug: section.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const section = getSectionBySlug(slug);
  if (!section) return {};
  const pageTitle = `${section.title} — База знаний об Аргентине`;
  return buildPublicPageMetadata({
    title: pageTitle,
    description: section.description,
    path: `/baza-znaniy/razdel/${section.slug}`,
  });
}

export default async function KnowledgeSectionPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getServerI18nLocale();
  const section = getSectionBySlug(slug);
  if (!section) notFound();

  const sectionPath = `/baza-znaniy/razdel/${section.slug}`;
  const total = getSectionCount(section.id);
  if (total === 0) notFound();
  const { hubs, groups } = getSectionGroups(section.id);

  return (
    <>
      <BreadcrumbListJsonLd
        items={buildDetailBreadcrumbItems(locale, "knowledgeBase", {
          name: section.title,
          path: sectionPath,
        })}
      />
      <WebPageJsonLd
        name={section.title}
        description={section.description}
        path={sectionPath}
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <KbBreadcrumbs
          items={[
            { label: "Главная", href: "/" },
            { label: "База знаний", href: "/baza-znaniy" },
            { label: section.title, href: sectionPath },
          ]}
        />

        <div className="mt-5 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
          {/* Постоянная навигация */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <KbSideNav sectionId={section.id} />
            </div>
          </aside>

          {/* Контент раздела */}
          <div className="min-w-0">
            <header className="flex items-start gap-4">
              <span aria-hidden className="text-3xl">
                {section.icon}
              </span>
              <div>
                <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                  {section.title}
                </h1>
                <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted">
                  {section.description}
                </p>
                <p className="mt-1 text-sm text-slate">Материалов: {total}</p>
              </div>
            </header>
            <div className="mt-6 max-w-xl">
              <KbSearchBox placeholder={`Поиск по базе: ${section.title.toLowerCase()}...`} />
            </div>

            {hubs.length > 0 && (
              <section className="mt-8">
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  С чего начать
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {hubs.map((entry) => (
                    <KbEntryCard key={entry.id} entry={entry} />
                  ))}
                </div>
              </section>
            )}

            {groups.map((group) => (
              <section key={group.type} className="mt-8">
                <h2 className="mb-3 flex items-baseline gap-2 text-lg font-semibold text-foreground">
                  {group.label}
                  <span className="text-sm font-normal text-slate">
                    {group.entries.length}
                  </span>
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {group.entries.map((entry) => (
                    <KbEntryCard key={entry.id} entry={entry} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
