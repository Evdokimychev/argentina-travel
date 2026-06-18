import type { Metadata } from "next";
import GeographyHubView from "@/components/destinations/GeographyHubView";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { getAllPlaceListings } from "@/data/places-seed";
import { getAllDestinations } from "@/lib/destinations";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { fetchCollectionsServer } from "@/lib/places-repository";

const PAGE_TITLE = "Регионы и места — Пора в Аргентину";
const PAGE_DESCRIPTION =
  "8 регионов для планирования поездки и справочник мест Аргентины: парки, ледники, водопады и города — с картой, подборками и турами.";

export const metadata: Metadata = buildPublicPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/destinations",
  image: "/media/destinations/patagonia/cover.jpg",
});

export default async function DestinationsPage() {
  const collections = await fetchCollectionsServer();
  const places = getAllPlaceListings();

  return (
    <>
      <WebPageJsonLd name={PAGE_TITLE} description={PAGE_DESCRIPTION} path="/destinations" />
      <GeographyHubView
        destinations={getAllDestinations()}
        places={places}
        collections={collections}
      />
    </>
  );
}
