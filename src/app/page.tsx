import MarketplaceHome from "@/components/marketplace/MarketplaceHome";
import { fetchMarketplaceTours } from "@/data/marketplace-tours";
import { blogPosts } from "@/data/blog";
import { testimonials } from "@/data/testimonials";

export default async function HomePage() {
  const tours = await fetchMarketplaceTours();

  return (
    <MarketplaceHome
      tours={tours}
      blogPosts={blogPosts}
      testimonials={testimonials}
    />
  );
}
