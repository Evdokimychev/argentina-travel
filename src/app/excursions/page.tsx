import { Suspense } from "react";
import type { Metadata } from "next";
import ExcursionsCatalog from "@/components/excursions/ExcursionsCatalog";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import { CatalogLoadingFallback } from "@/components/ui/skeleton";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { resolveLocaleBreadcrumbItems } from "@/lib/locale-breadcrumbs";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { resolveStaticPageCopy } from "@/lib/static-page-copy";
import { fetchExcursionsServer } from "@/lib/tripster/excursion-server";

const PAGE_TITLE_FALLBACK = "Экскурсии по Аргентине";
const PAGE_DESCRIPTION_FALLBACK =
  "Городские экскурсии и активности в Буэнос-Айресе, Патагонии и других регионах Аргентины.";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerI18nLocale();
  const title = resolveStaticPageCopy(
    "excursions.catalog.title",
    PAGE_TITLE_FALLBACK,
    locale
  );
  const description = resolveStaticPageCopy(
    "excursions.subtitle",
    PAGE_DESCRIPTION_FALLBACK,
    locale
  );

  return {
    ...buildPublicPageMetadata({
      title,
      description,
      path: "/excursions",
    }),
    alternates: buildHreflangAlternates("/excursions"),
  };
}

export default async function ExcursionsPage() {
  const locale = await getServerI18nLocale();
  const { items, cities } = await fetchExcursionsServer({ pageSize: 500 });
  const breadcrumbItems = resolveLocaleBreadcrumbItems(locale, [
    { labelKey: "nav.home", path: "/", fallback: "Главная" },
    {
      labelKey: "excursions.catalog.title",
      path: "/excursions",
      fallback: PAGE_TITLE_FALLBACK,
    },
  ]);

  return (
    <>
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <Suspense fallback={<CatalogLoadingFallback title="Загружаем каталог экскурсий…" />}>
        <ExcursionsCatalog
          excursions={items}
          cities={cities}
          title="Экскурсии"
          subtitle="Городские маршруты и активности по Аргентине"
        />
      </Suspense>
    </>
  );
}
