import type { Metadata } from "next";
import { notFound } from "next/navigation";

import KbBreadcrumbs from "@/components/knowledge-base/KbBreadcrumbs";
import KbEntryCard from "@/components/knowledge-base/KbEntryCard";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import {
  KB_SECTIONS,
  getSectionBySlug,
  getSectionEntries,
} from "@/lib/knowledge-base/content";
import { buildDetailBreadcrumbItems } from "@/lib/detail-breadcrumbs";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return KB_SECTIONS.map((section) => ({ slug: section.slug }));
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

  const entries = getSectionEntries(section.id);
  const sectionPath = `/baza-znaniy/razdel/${section.slug}`;

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
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <KbBreadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "База знаний", href: "/baza-znaniy" },
          { label: section.title, href: `/baza-znaniy/razdel/${section.slug}` },
        ]}
      />

      <header className="mt-4 flex items-start gap-4">
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
          <p className="mt-1 text-sm text-slate">Материалов: {entries.length}</p>
        </div>
      </header>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <KbEntryCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
    </>
  );
}
