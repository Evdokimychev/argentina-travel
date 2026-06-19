import type { Metadata } from "next";
import PlacesCatalog from "@/components/places/PlacesCatalog";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { fetchCollectionsServer } from "@/lib/places-repository";
import { resolvePlaceCatalog } from "@/lib/cms/place-resolver";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import {
  parsePlaceFiltersFromSearchParamsRecord,
  parsePlacesViewMode,
} from "@/lib/places-catalog-filters";
import { buildPlacesCatalogMetadata } from "@/lib/places-seo";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerI18nLocale();
  const places = await resolvePlaceCatalog(locale);
  return {
    ...buildPlacesCatalogMetadata(places.length),
    alternates: buildHreflangAlternates("/places"),
  };
}

export default async function PlacesPage({ searchParams }: PageProps) {
  const locale = await getServerI18nLocale();
  const resolvedSearchParams = await searchParams;
  const [places, collections] = await Promise.all([
    resolvePlaceCatalog(locale),
    fetchCollectionsServer(),
  ]);

  const pageTitle = `Справочник мест — ${places.length} локаций`;
  const pageDescription =
    "Парки, города, ледники и водопады Аргентины — поиск, карта, фильтры и тематические подборки.";

  return (
    <>
      <WebPageJsonLd name={pageTitle} description={pageDescription} path="/places" />
      <PlacesCatalog
        places={places}
        collections={collections}
        initialFilters={parsePlaceFiltersFromSearchParamsRecord(resolvedSearchParams)}
        initialViewMode={parsePlacesViewMode(resolvedSearchParams)}
      />
    </>
  );
}
