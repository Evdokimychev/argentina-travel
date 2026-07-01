import type { Metadata } from "next";
import { Suspense } from "react";
import PlacesCatalog from "@/components/places/PlacesCatalog";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import CatalogItemListJsonLd from "@/components/seo/CatalogItemListJsonLd";
import PlacesCatalogSeoLinks from "@/components/seo/PlacesCatalogSeoLinks";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { CatalogLoadingFallback } from "@/components/ui/skeleton";
import { fetchCollectionsServer } from "@/lib/places-repository";
import { resolvePlaceCatalog } from "@/lib/cms/place-resolver";
import { buildPlacesCatalogItemListJsonLd } from "@/lib/catalog-json-ld";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { resolveLocaleBreadcrumbItems } from "@/lib/locale-breadcrumbs";
import {
  buildPlacesCatalogJsonLd,
  buildPlacesCatalogPageMetadata,
  getServerPlacesCatalogView,
  hasActivePlaceCatalogFilters,
} from "@/lib/places-catalog-seo";
import {
  parsePlaceFiltersFromSearchParamsRecord,
  parsePlacesViewMode,
} from "@/lib/places-catalog-filters";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const locale = await getServerI18nLocale();
  const resolvedSearchParams = await searchParams;
  const places = await resolvePlaceCatalog(locale);
  return buildPlacesCatalogPageMetadata(resolvedSearchParams, places, locale);
}

export default async function PlacesPage({ searchParams }: PageProps) {
  const locale = await getServerI18nLocale();
  const resolvedSearchParams = await searchParams;
  const [places, collections] = await Promise.all([
    resolvePlaceCatalog(locale),
    fetchCollectionsServer(),
  ]);

  const view = getServerPlacesCatalogView(resolvedSearchParams, places);
  const jsonLd = buildPlacesCatalogJsonLd(places, locale);
  const indexable = !hasActivePlaceCatalogFilters(resolvedSearchParams);
  const breadcrumbItems = resolveLocaleBreadcrumbItems(locale, [
    { labelKey: "nav.home", path: "/", fallback: "Главная" },
    { labelKey: "places.title", path: "/places", fallback: "Места Аргентины" },
  ]);

  return (
    <>
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <WebPageJsonLd name={jsonLd.name} description={jsonLd.description} path="/places" />
      {indexable ? (
        <CatalogItemListJsonLd
          data={buildPlacesCatalogItemListJsonLd(view.filtered, locale)}
        />
      ) : null}
      <PlacesCatalogSeoLinks places={view.filtered} />
      <Suspense fallback={<CatalogLoadingFallback title="Загружаем справочник мест…" />}>
        <PlacesCatalog
          places={places}
          collections={collections}
          initialFilters={parsePlaceFiltersFromSearchParamsRecord(resolvedSearchParams)}
          initialViewMode={parsePlacesViewMode(resolvedSearchParams)}
        />
      </Suspense>
    </>
  );
}
