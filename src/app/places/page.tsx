import { Suspense } from "react";
import type { Metadata } from "next";
import PlacesCatalog from "@/components/places/PlacesCatalog";
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

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-24 text-center text-slate">Загрузка каталога…</div>
      }
    >
      <PlacesCatalog places={places} collections={collections} />
    </Suspense>
  );
}
