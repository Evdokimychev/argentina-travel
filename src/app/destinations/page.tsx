import type { Metadata } from "next";
import DestinationsIndexView from "@/components/destinations/DestinationsIndexView";
import { getAllDestinations } from "@/lib/destinations";

export const metadata: Metadata = {
  title: "Направления — Пора в Аргентину",
  description:
    "8 направлений Аргентины: Буэнос-Айрес, Патагония, Игуасу, Мендоса, Сальта и другие — сезоны, как добраться и туры от организаторов.",
};

export default function DestinationsPage() {
  return <DestinationsIndexView destinations={getAllDestinations()} />;
}
