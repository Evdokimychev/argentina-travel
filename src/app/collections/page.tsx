import type { Metadata } from "next";
import CollectionsIndexView from "@/components/collections/CollectionsIndexView";
import { fetchCollectionsServer } from "@/lib/places-repository";

export const metadata: Metadata = {
  title: "Подборки мест — Пора в Аргентину",
  description: "Тематические коллекции мест Аргентины: Patagonia, UNESCO, винный маршрут и другие.",
  alternates: { canonical: "/collections" },
};

export default async function CollectionsPage() {
  const collections = await fetchCollectionsServer();
  return <CollectionsIndexView collections={collections} />;
}
