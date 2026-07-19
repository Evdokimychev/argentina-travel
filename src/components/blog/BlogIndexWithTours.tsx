import BlogIndexView from "@/components/blog/BlogIndexView";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import type { BlogHeroVariant } from "@/lib/blog-hero-variant";
import type { BlogPost } from "@/types";
import { pickBlogIndexFeaturedTours } from "@/lib/blog-index-tours";
import { toBlogIndexCatalog } from "@/lib/blog-index-payload";

type BlogIndexWithToursProps = {
  posts: BlogPost[];
  initialPersonalizedPosts: BlogPost[];
  heroVariant: BlogHeroVariant;
  initialTag?: string | null;
  initialCategory?: string | null;
};

export default async function BlogIndexWithTours({
  posts,
  initialPersonalizedPosts,
  heroVariant,
  initialTag = null,
  initialCategory = null,
}: BlogIndexWithToursProps) {
  const tours = await fetchMarketplaceTours();

  return (
    <BlogIndexView
      posts={toBlogIndexCatalog(posts)}
      featuredTours={pickBlogIndexFeaturedTours(tours, 4)}
      initialPersonalizedSlugs={initialPersonalizedPosts.map((post) => post.slug)}
      heroVariant={heroVariant}
      initialTag={initialTag}
      initialCategory={initialCategory}
    />
  );
}
