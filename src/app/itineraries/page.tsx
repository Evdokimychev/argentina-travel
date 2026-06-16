import type { Metadata } from "next";
import ItinerariesIndexView from "@/components/itineraries/ItinerariesIndexView";
import { fetchItinerariesServer } from "@/lib/places-repository";

export const metadata: Metadata = {
  title: "Маршруты по Аргентине — Пора в Аргентину",
  description: "Готовые маршруты: Patagonia, северо-запад, Buenos Aires и Iguazú.",
  alternates: { canonical: "/itineraries" },
};

export default async function ItinerariesPage() {
  const itineraries = await fetchItinerariesServer();
  return <ItinerariesIndexView itineraries={itineraries} />;
}
