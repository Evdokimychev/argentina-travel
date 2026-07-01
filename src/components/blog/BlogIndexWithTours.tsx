import BlogIndexView from "@/components/blog/BlogIndexView";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import type { BlogHeroVariant } from "@/lib/blog-hero-variant";
import type { BlogPost } from "@/types";

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
  const initialTours = await fetchMarketplaceTours();

  return (
    <BlogIndexView
      posts={posts}
      initialTours={initialTours}
      initialPersonalizedPosts={initialPersonalizedPosts}
      heroVariant={heroVariant}
      initialTag={initialTag}
      initialCategory={initialCategory}
    />
  );
}
