import type { Metadata } from "next";
import GeographyHubView from "@/components/destinations/GeographyHubView";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { resolveDestinationCatalog } from "@/lib/cms/destination-resolver";
import { resolvePlaceCatalog } from "@/lib/cms/place-resolver";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { fetchCollectionsServer } from "@/lib/places-repository";

const PAGE_TITLE = "Регионы и места — Пора в Аргентину";
const PAGE_DESCRIPTION =
  "8 регионов для планирования поездки и справочник мест Аргентины: парки, ледники, водопады и города — с картой, подборками и турами.";

export const metadata: Metadata = {
  ...buildPublicPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: "/destinations",
    image: "/media/destinations/patagonia/cover.jpg",
  }),
  alternates: buildHreflangAlternates("/destinations"),
};

export default async function DestinationsPage() {
  const locale = await getServerI18nLocale();
  const [collections, destinations, places] = await Promise.all([
    fetchCollectionsServer(),
    resolveDestinationCatalog(locale),
    resolvePlaceCatalog(locale),
  ]);

  return (
    <>
      <WebPageJsonLd name={PAGE_TITLE} description={PAGE_DESCRIPTION} path="/destinations" />
      <GeographyHubView
        destinations={destinations}
        places={places}
        collections={collections}
      />
    </>
  );
}
