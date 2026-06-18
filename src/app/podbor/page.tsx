import type { Metadata } from "next";
import PodborView from "@/components/podbor/PodborView";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";

export const metadata: Metadata = {
  title: "Подбор маршрута по Аргентине",
  description:
    "Интерактивный подбор путешествия по Аргентине: регионы, туры и экскурсии под ваши цели, бюджет и темп.",
};

export default async function PodborPage() {
  const tours = await fetchMarketplaceTours();

  return (
    <div className="pb-8">
      <PodborView tours={tours} />
    </div>
  );
}
