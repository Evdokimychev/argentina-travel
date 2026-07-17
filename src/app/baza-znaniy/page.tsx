import type { Metadata } from "next";
import Link from "next/link";

import KbHubCard from "@/components/knowledge-base/KbHubCard";
import KbSearchBox from "@/components/knowledge-base/KbSearchBox";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import {
  KB_SECTIONS,
  KB_HUB_ORDER,
  getSectionCountFrom,
  sectionHref,
} from "@/lib/knowledge-base/content";
import { resolveKnowledgeCatalog } from "@/lib/cms/knowledge-resolver";
import { buildTwoLevelBreadcrumbItems } from "@/lib/detail-breadcrumbs";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

const PAGE_TITLE = "База знаний об Аргентине — путеводитель, переезд, документы, деньги";
const PAGE_DESCRIPTION =
  "Структурированная база знаний «Пора в Аргентину»: путешествия, переезд, документы и легализация, деньги, жизнь в стране и личный опыт. Сотни проверенных материалов с поиском и навигацией.";

export const metadata: Metadata = buildPublicPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/baza-znaniy",
});

export default async function KnowledgeBaseHomePage() {
  const locale = await getServerI18nLocale();
  const entries = await resolveKnowledgeCatalog(locale);
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const hubs = KB_HUB_ORDER.map((id) => byId.get(id)).filter(
    (entry): entry is NonNullable<typeof entry> => Boolean(entry),
  );
  const total = entries.length;

  return (
    <>
      <BreadcrumbListJsonLd
        items={buildTwoLevelBreadcrumbItems(locale, {
          labelKey: "nav.knowledgeBase",
          path: "/baza-znaniy",
          fallback: "База знаний",
        })}
      />
      <WebPageJsonLd name={PAGE_TITLE} description={PAGE_DESCRIPTION} path="/baza-znaniy" />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Hero */}
      <header className="mx-auto max-w-3xl text-center">
        <p className="mb-2 text-sm font-medium uppercase tracking-wide text-sky-ink">
          Пора в Аргентину
        </p>
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          База знаний об Аргентине
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-muted">
          Честные, практичные и проверенные материалы для путешественников и тех,
          кто переезжает: {total}+ статей о поездках, документах, деньгах и жизни в
          стране. Начните с поиска или выберите точку входа.
        </p>
        <div className="mx-auto mt-6 max-w-xl">
          <KbSearchBox autoFocus />
        </div>
      </header>

      {/* Точки входа (хабы) */}
      <section className="mt-12">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            С чего начать
          </h2>
          <span className="text-sm text-muted">Точки входа по темам</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {hubs.map((hub) => (
            <KbHubCard key={hub.id} entry={hub} />
          ))}
        </div>
      </section>

      {/* Разделы */}
      <section className="mt-12">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Разделы</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {KB_SECTIONS.map((section) => (
            <Link
              key={section.id}
              href={sectionHref(section.slug)}
              className="card-hover group flex items-start gap-4 rounded-panel border border-border-subtle bg-surface-elevated p-5 shadow-card transition-shadow duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 motion-reduce:transition-none"
            >
              <span aria-hidden className="text-2xl">
                {section.icon}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-foreground group-hover:text-sky-ink">
                    {section.title}
                  </span>
                  <span className="rounded-full bg-surface-muted px-2 py-0.5 text-2xs font-medium text-slate">
                    {getSectionCountFrom(entries, section.id)}
                  </span>
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-muted">
                  {section.description}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
      </div>
    </>
  );
}
