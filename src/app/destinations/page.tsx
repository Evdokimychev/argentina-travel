import type { Metadata } from "next";
import GeographyHubView from "@/components/destinations/GeographyHubView";
import BreadcrumbListJsonLd from "@/components/seo/BreadcrumbListJsonLd";
import CatalogItemListJsonLd from "@/components/seo/CatalogItemListJsonLd";
import DestinationsCatalogSeoLinks from "@/components/seo/DestinationsCatalogSeoLinks";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { buildDestinationsCatalogItemListJsonLd } from "@/lib/catalog-json-ld";
import { resolveDestinationCatalog } from "@/lib/cms/destination-resolver";
import { resolvePlaceCatalog } from "@/lib/cms/place-resolver";
import {
  buildDestinationsCatalogJsonLd,
  buildDestinationsCatalogMetadata,
} from "@/lib/destinations-catalog-seo";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { resolveLocaleBreadcrumbItems } from "@/lib/locale-breadcrumbs";
import { fetchCollectionsServer } from "@/lib/places-repository";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerI18nLocale();
  return buildDestinationsCatalogMetadata(locale);
}

export default async function DestinationsPage() {
  const locale = await getServerI18nLocale();
  const [collections, destinations, places] = await Promise.all([
    fetchCollectionsServer(),
    resolveDestinationCatalog(locale),
    resolvePlaceCatalog(locale),
  ]);

  const jsonLd = buildDestinationsCatalogJsonLd(destinations, locale);
  const breadcrumbItems = resolveLocaleBreadcrumbItems(locale, [
    { labelKey: "nav.home", path: "/", fallback: "Главная" },
    { labelKey: "nav.geography", path: "/destinations", fallback: "Регионы и места" },
  ]);

  return (
    <>
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <WebPageJsonLd
        name={jsonLd.name}
        description={jsonLd.description}
        path="/destinations"
      />
      <CatalogItemListJsonLd
        data={buildDestinationsCatalogItemListJsonLd(destinations, locale)}
      />
      <DestinationsCatalogSeoLinks destinations={destinations} places={places} />
      <GeographyHubView
        destinations={destinations}
        places={places}
        collections={collections}
      />
    </>
  );
}
