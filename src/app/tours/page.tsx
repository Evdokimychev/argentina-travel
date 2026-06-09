import ToursCatalog from "@/components/marketplace/ToursCatalog";
import { fetchMarketplaceTours } from "@/data/marketplace-tours";

export const metadata = {
  title: "Каталог туров",
  description: "Авторские путешествия по Аргентине с удобным поиском и фильтрами",
};

export default async function ToursPage() {
  const tours = await fetchMarketplaceTours();
  return <ToursCatalog tours={tours} />;
}
