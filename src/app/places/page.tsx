import type { Metadata } from "next";
import { Suspense } from "react";
import PlacesCatalog from "@/components/places/PlacesCatalog";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import PlacesCatalogSeoLinks from "@/components/seo/PlacesCatalogSeoLinks";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { CatalogLoadingFallback } from "@/components/ui/skeleton";
import { fetchCollectionsServer } from "@/lib/places-repository";
import { resolvePlaceCatalog } from "@/lib/cms/place-resolver";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import {
  buildPlacesCatalogJsonLd,
  buildPlacesCatalogPageMetadata,
  getServerPlacesCatalogView,
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

  return (
    <>
      <BreadcrumbListJsonLd
        items={[
          { name: "Главная", path: "/" },
          { name: "Места Аргентины", path: "/places" },
        ]}
      />
      <WebPageJsonLd name={jsonLd.name} description={jsonLd.description} path="/places" />
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
