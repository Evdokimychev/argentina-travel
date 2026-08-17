import { Suspense } from "react";
import type { Metadata } from "next";
import ToursCatalog from "@/components/marketplace/ToursCatalog";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import CatalogItemListJsonLd from "@/components/seo/CatalogItemListJsonLd";
import CatalogSeoLinks from "@/components/seo/CatalogSeoLinks";
import CommercialSeoSection from "@/components/seo/CommercialSeoSection";
import { CatalogLoadingFallback } from "@/components/ui/skeleton";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import { buildToursCatalogItemListJsonLd } from "@/lib/catalog-json-ld";
import { buildCatalogMetadata, getServerCatalogView, hasActiveCatalogFilters } from "@/lib/catalog-seo";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { resolveLocaleBreadcrumbItems } from "@/lib/locale-breadcrumbs";
import { getPlatformStatsFromMarketplace } from "@/lib/organizer-public";
import { TOURS_CATALOG_SEO } from "@/lib/commercial-catalog-seo";
import type { TourListing } from "@/types";

export const dynamic = "force-dynamic";

type ToursPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Catalog outage must not strip metadata or replace /tours with an error shell. */
async function loadToursCatalogSafely(): Promise<TourListing[]> {
  try {
    return await fetchMarketplaceTours();
  } catch (error) {
    console.error("[tours_catalog_unavailable]", {
      message: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

export async function generateMetadata({ searchParams }: ToursPageProps): Promise<Metadata> {
  const params = await searchParams;
  const tours = await loadToursCatalogSafely();
  return buildCatalogMetadata(params, tours);
}

export default async function ToursPage({ searchParams }: ToursPageProps) {
  const locale = await getServerI18nLocale();
  const params = await searchParams;
  const tours = await loadToursCatalogSafely();
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
      <CommercialSeoSection copy={TOURS_CATALOG_SEO} />
    </>
  );
}
