import { Suspense } from "react";
import type { Metadata } from "next";
import ToursCatalog from "@/components/marketplace/ToursCatalog";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import CatalogItemListJsonLd from "@/components/seo/CatalogItemListJsonLd";
import CatalogSeoLinks from "@/components/seo/CatalogSeoLinks";
import { CatalogLoadingFallback } from "@/components/ui/skeleton";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import { buildToursCatalogItemListJsonLd } from "@/lib/catalog-json-ld";
import { buildCatalogMetadata, getServerCatalogView, hasActiveCatalogFilters } from "@/lib/catalog-seo";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { resolveLocaleBreadcrumbItems } from "@/lib/locale-breadcrumbs";
import { getPlatformStatsFromMarketplace } from "@/lib/organizer-public";

export const dynamic = "force-dynamic";

type ToursPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: ToursPageProps): Promise<Metadata> {
  const params = await searchParams;
  const tours = await fetchMarketplaceTours();
  return buildCatalogMetadata(params, tours);
}

export default async function ToursPage({ searchParams }: ToursPageProps) {
  const locale = await getServerI18nLocale();
  const params = await searchParams;
  const tours = await fetchMarketplaceTours();
  const platformStats = getPlatformStatsFromMarketplace(tours);
  const view = getServerCatalogView(params, tours);
  const indexable = !hasActiveCatalogFilters(params, tours);
  const breadcrumbItems = resolveLocaleBreadcrumbItems(locale, [
    { labelKey: "nav.home", path: "/", fallback: "Главная" },
    {
      labelKey: "tours.catalog.title",
      path: "/tours",
      fallback: "Каталог туров по Аргентине",
    },
  ]);

  return (
    <>
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      {indexable ? (
        <CatalogItemListJsonLd data={buildToursCatalogItemListJsonLd(view.filtered, locale)} />
      ) : null}
      <CatalogSeoLinks tours={view.filtered} />
      <Suspense fallback={<CatalogLoadingFallback title="Загружаем каталог туров…" />}>
        <ToursCatalog tours={tours} platformStats={platformStats} />
      </Suspense>
    </>
  );
}
