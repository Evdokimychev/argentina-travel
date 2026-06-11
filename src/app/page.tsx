import type { Metadata } from "next";
import MarketplaceHome from "@/components/marketplace/MarketplaceHome";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import { blogPosts } from "@/data/blog";
import { collectTopVerifiedReviews } from "@/lib/homepage-reviews";
import { getPlatformStatsFromRepository } from "@/lib/organizer-public";

export const metadata: Metadata = {
  title: "Авторские туры по Аргентине — Патагония, Буэнос-Айрес, Мендоса",
  description:
    "Русскоязычные гиды, проверенные маршруты и путеводитель по стране: туры, иммиграция и практические советы для поездки.",
};

export default async function HomePage() {
  const tours = await fetchMarketplaceTours();
  const testimonials = collectTopVerifiedReviews(3);
  const platformStats = getPlatformStatsFromRepository();

  return (
    <MarketplaceHome
      tours={tours}
      blogPosts={blogPosts}
      testimonials={testimonials}
      platformStats={platformStats}
    />
  );
}
