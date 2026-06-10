import type { Metadata } from "next";
import DestinationsIndexView from "@/components/destinations/DestinationsIndexView";
import { getAllDestinations } from "@/lib/destinations";

export const metadata: Metadata = {
  title: "Направления — Пора в Аргентину",
  description:
    "Популярные регионы и города Аргентины: Патагония, Буэнос-Айрес, Игуасу, Мендоса и другие — с турами от организаторов.",
};

export default function DestinationsPage() {
  return <DestinationsIndexView destinations={getAllDestinations()} />;
}
