import MarketplaceHome from "@/components/marketplace/MarketplaceHome";
import { fetchMarketplaceTours } from "@/data/marketplace-tours";
import { blogPosts } from "@/data/blog";
import { collectTopVerifiedReviews } from "@/lib/homepage-reviews";
import { getPlatformStatsFromRepository } from "@/lib/organizer-public";

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
