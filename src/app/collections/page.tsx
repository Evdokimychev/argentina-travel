import type { Metadata } from "next";
import CollectionsIndexView from "@/components/collections/CollectionsIndexView";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { getServicePageHeroImage } from "@/lib/media-resolver";
import { fetchCollectionsServer } from "@/lib/places-repository";

const PAGE_TITLE = "Подборки мест — тематические коллекции Аргентины";
const PAGE_DESCRIPTION =
  "Тематические коллекции мест Аргентины: Патагония, UNESCO, винный маршрут и другие подборки для планирования поездки.";

export const metadata: Metadata = {
  ...buildPublicPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: "/collections",
    image: getServicePageHeroImage("places"),
  }),
  alternates: buildHreflangAlternates("/collections"),
};

export default async function CollectionsPage() {
  const collections = await fetchCollectionsServer();
  return <CollectionsIndexView collections={collections} />;
}
