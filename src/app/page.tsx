import type { Metadata } from "next";
import MarketplaceHome from "@/components/marketplace/MarketplaceHome";
import TravelPrepStrip from "@/components/flights/TravelPrepStrip";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import { blogPosts } from "@/data/blog";
import { collectTopVerifiedReviews } from "@/lib/homepage-reviews";
import { getPlatformStatsFromRepository } from "@/lib/organizer-public";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

const PAGE_TITLE = "Авторские туры по Аргентине — Патагония, Буэнос-Айрес, Мендоса";
const PAGE_DESCRIPTION =
  "Русскоязычные гиды, проверенные маршруты и путеводитель по стране: туры, иммиграция и практические советы для поездки.";

export const metadata: Metadata = buildPublicPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/",
});

export default async function HomePage() {
  const tours = await fetchMarketplaceTours();
  const testimonials = collectTopVerifiedReviews(3);
  const platformStats = getPlatformStatsFromRepository();

  return (
    <>
      <WebPageJsonLd name={PAGE_TITLE} description={PAGE_DESCRIPTION} path="/" />
      <MarketplaceHome
        tours={tours}
        blogPosts={blogPosts}
        testimonials={testimonials}
        platformStats={platformStats}
        travelPrepStrip={<TravelPrepStrip />}
      />
    </>
  );
}
