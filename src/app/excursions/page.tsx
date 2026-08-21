import { Suspense } from "react";
import type { Metadata } from "next";
import ExcursionsCatalog from "@/components/excursions/ExcursionsCatalog";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import CatalogItemListJsonLd from "@/components/seo/CatalogItemListJsonLd";
import CommercialSeoSection from "@/components/seo/CommercialSeoSection";
import { CatalogLoadingFallback } from "@/components/ui/skeleton";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { resolveLocaleBreadcrumbItems } from "@/lib/locale-breadcrumbs";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { resolveStaticPageCopy } from "@/lib/static-page-copy";
import { fetchExcursionsResultSafely } from "@/lib/tripster/excursion-server";
import { buildExcursionsCatalogItemListJsonLd } from "@/lib/catalog-json-ld";
import { EXCURSIONS_CATALOG_SEO } from "@/lib/commercial-catalog-seo";

export const dynamic = "force-dynamic";

const PAGE_TITLE_FALLBACK = "Экскурсии по Аргентине с местными гидами";
const PAGE_DESCRIPTION_FALLBACK =
  "Экскурсии по Аргентине: Буэнос-Айрес, Игуасу, Ушуайя и другие города. Сравнивайте темы, формат, язык, даты и условия в карточках предложений.";

const EXCURSION_FILTER_PARAMS = new Set([
  "query",
  "city",
  "sort",
  "format",
  "duration",
  "minRating",
  "maxPrice",
  "partner",
  "page",
]);

type ExcursionsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: ExcursionsPageProps): Promise<Metadata> {
  const locale = await getServerI18nLocale();
  const params = await searchParams;
  const title = resolveStaticPageCopy(
    "excursions.catalog.title",
    PAGE_TITLE_FALLBACK,
    locale
  );
  const localizedDescription = resolveStaticPageCopy(
    "excursions.subtitle",
    PAGE_DESCRIPTION_FALLBACK,
    locale
  );
  const description =
    localizedDescription.trim().length >= 50
      ? localizedDescription
      : PAGE_DESCRIPTION_FALLBACK;

  const hasCatalogParams = Object.keys(params).some((key) => EXCURSION_FILTER_PARAMS.has(key));

  return {
    ...buildPublicPageMetadata({
      title,
      description,
      path: "/excursions",
    }),
    alternates: buildHreflangAlternates("/excursions"),
    ...(hasCatalogParams ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ExcursionsPage() {
  const locale = await getServerI18nLocale();
  const excursionsResult = await fetchExcursionsResultSafely(
    { pageSize: 500 },
    "excursions_catalog_unavailable",
  );
  const catalogUnavailable = excursionsResult.status === "unavailable";
  const items = catalogUnavailable ? [] : excursionsResult.data.items;
  const cities = catalogUnavailable ? [] : excursionsResult.data.cities;
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
      <CatalogItemListJsonLd
        data={buildExcursionsCatalogItemListJsonLd(items, {
          name: PAGE_TITLE_FALLBACK,
        })}
      />
      <Suspense fallback={<CatalogLoadingFallback title="Загружаем каталог экскурсий…" />}>
        <ExcursionsCatalog
          excursions={items}
          cities={cities}
          catalogUnavailable={catalogUnavailable}
          title="Экскурсии по Аргентине с местными гидами"
          subtitle="Городские прогулки, природные маршруты и активности с понятными условиями"
        />
      </Suspense>
      <CommercialSeoSection copy={EXCURSIONS_CATALOG_SEO} />
    </>
  );
}
