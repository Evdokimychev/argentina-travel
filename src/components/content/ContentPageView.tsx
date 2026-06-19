import Link from "next/link";
import ImmigrationSectionNav from "@/components/immigration/ImmigrationSectionNav";
import ContentReadingLayout from "@/components/content/ContentReadingLayout";
import SharePageLinkButton from "@/components/content/SharePageLinkButton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { buildTocItemsFromHeadings, headingToAnchorId } from "@/lib/content-heading-id";
import { mapContentRelatedLinks } from "@/lib/content-related-links";
import { getContentHubMeta } from "@/lib/content-pages";
import { siteContainerClass, siteScrollAnchorClass } from "@/lib/site-container";
import type { ImmigrationFreshnessState } from "@/types/content-freshness";
import type { ContentPage } from "@/types/content-page";

interface ContentPageViewProps {
  page: ContentPage;
  freshness?: ImmigrationFreshnessState;
}

function formatRuDate(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default function ContentPageView({ page, freshness }: ContentPageViewProps) {
  const hub = getContentHubMeta(page.section);
  const isImmigration = page.section === "immigration";
  const freshnessDateLabel = formatRuDate(freshness?.lastVerifiedAt ?? page.updatedAt);
  const showFreshBadge = isImmigration && freshness?.status === "fresh";
  const showCriticalWarning = isImmigration && freshness?.status === "critical";
  const usedIds = new Set<string>();
  const sectionsWithIds = page.sections.map((section) => {
    if (!section.heading) return { section, headingId: undefined as string | undefined };
    const headingId = headingToAnchorId(section.heading, usedIds);
    return { section, headingId };
  });
  const tocItems = buildTocItemsFromHeadings(
    sectionsWithIds
      .filter((entry) => entry.headingId)
      .map((entry) => ({ heading: entry.section.heading! }))
  );

  return (
    <>
      {page.section === "immigration" ? <ImmigrationSectionNav /> : null}
      <div className="bg-surface-muted pb-16">
        <div className={cn(siteContainerClass, "py-8 md:py-12")}>
          <nav className="text-sm text-slate" aria-label="Хлебные крошки">
            <Link href="/" className="transition-colors hover:text-sky">
              Главная
            </Link>
            <span className="mx-2 text-gray-300">/</span>
            <Link href={hub.href} className="transition-colors hover:text-sky">
              {hub.label}
            </Link>
            <span className="mx-2 text-gray-300">/</span>
            <span className="text-charcoal">{page.title}</span>
          </nav>

          <header className="mt-6 max-w-3xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-block rounded-full bg-sky/10 px-3 py-1 text-xs font-medium text-sky">
                    {page.category}
                  </span>
                  {showFreshBadge ? (
                    <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                      Обновлено {freshnessDateLabel}
                    </span>
                  ) : null}
                </div>
                <h1 className="mt-4 font-display text-3xl font-bold text-charcoal md:text-4xl">
                  {page.title}
                </h1>
                <p className="mt-3 text-base leading-relaxed text-slate">{page.description}</p>
                <p className="mt-2 text-xs text-slate/80">
                  {isImmigration ? "Последняя проверка:" : "Обновлено:"} {freshnessDateLabel}
                </p>
                {showCriticalWarning ? (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Материал не обновлялся более полугода (около {freshness?.ageDays ?? 0} дней). Перед
                    подачей документов обязательно сверяйте требования с Migraciones и консульством.
                  </div>
                ) : null}
              </div>
              <SharePageLinkButton title={page.title} className="shrink-0" />
            </div>
          </header>

          <ContentReadingLayout
            className="mt-8"
            tocItems={tocItems}
            relatedItems={page.relatedLinks?.length ? mapContentRelatedLinks(page.relatedLinks) : []}
            footer={
              page.relatedTourQuery ? (
                <div className="rounded-2xl bg-patagonia/5 p-6 text-center">
                  <p className="font-heading text-lg font-bold text-charcoal">
                    Туры по теме: {page.relatedTourQuery}
                  </p>
                  <p className="mt-2 text-sm text-slate">
                    Авторские маршруты от организаторов на платформе
                  </p>
                  <Link
                    href={`/tours?query=${encodeURIComponent(page.relatedTourQuery)}`}
                    className={cn(buttonVariants(), "mt-4 inline-flex rounded-full px-6")}
                  >
                    Смотреть туры
                  </Link>
                </div>
              ) : undefined
            }
          >
            <div className="space-y-8">
              {sectionsWithIds.map(({ section, headingId }, index) => (
                  <section key={index}>
                    {section.heading ? (
                      <h2
                        id={headingId}
                        className={cn(
                          "font-heading text-xl font-bold text-charcoal",
                          siteScrollAnchorClass
                        )}
                      >
                        {section.heading}
                      </h2>
                    ) : null}
                    {section.paragraphs?.map((paragraph, pIndex) => (
                      <p
                        key={pIndex}
                        className={cn(section.heading || pIndex > 0 ? "mt-4" : undefined)}
                      >
                        {paragraph}
                      </p>
                    ))}
                    {section.list ? (
                      <ul className="mt-4 list-disc space-y-2 pl-5">
                        {section.list.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
              ))}
            </div>
          </ContentReadingLayout>

          <p className="mt-8 text-sm text-slate">
            {page.section === "immigration" ? (
              <>
                Нужна персональная консультация?{" "}
                <Link href="/contacts" className="font-medium text-sky hover:underline">
                  Свяжитесь с нами
                </Link>
                . Материал носит справочный характер и не заменяет юридическую помощь.
              </>
            ) : (
              <>
                Остались вопросы?{" "}
                <Link href="/faq" className="font-medium text-sky hover:underline">
                  Частые вопросы
                </Link>
                {" · "}
                <Link href="/contacts" className="font-medium text-sky hover:underline">
                  Контакты
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </>
  );
}
