import { Suspense } from "react";
import type { Metadata } from "next";
import PlacesCatalog from "@/components/places/PlacesCatalog";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { fetchCollectionsServer, fetchPlacesServer } from "@/lib/places-repository";
import { buildPlacesCatalogMetadata } from "@/lib/places-seo";

export async function generateMetadata(): Promise<Metadata> {
  const places = await fetchPlacesServer();
  return buildPlacesCatalogMetadata(places.length);
}

export default async function PlacesPage() {
  const [places, collections] = await Promise.all([
    fetchPlacesServer(),
    fetchCollectionsServer(),
  ]);

  const pageTitle = `Справочник мест — ${places.length} локаций`;
  const pageDescription =
    "Парки, города, ледники и водопады Аргентины — поиск, карта, фильтры и тематические подборки.";

  return (
    <>
      <WebPageJsonLd name={pageTitle} description={pageDescription} path="/places" />
      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-4 py-24 text-center text-slate">Загрузка каталога…</div>
        }
      >
        <PlacesCatalog places={places} collections={collections} />
      </Suspense>
    </>
  );
}
