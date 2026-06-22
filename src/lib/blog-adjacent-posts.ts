import { blogPosts } from "@/data/blog";
import { getPrimaryBlogHubForPost, getBlogHubPosts } from "@/data/blog-hubs";
import { filterIndexableBlogPosts, sortBlogPostsByDate } from "@/lib/blog-utils";
import type { BlogPost } from "@/types";

export type BlogAdjacentPosts = {
  prev: BlogPost | null;
  next: BlogPost | null;
};

function getOrderedPostsForNavigation(post: BlogPost, catalog: BlogPost[]): BlogPost[] {
  const primaryHub = getPrimaryBlogHubForPost(post);
  if (primaryHub) {
    return getBlogHubPosts(primaryHub, catalog);
  }
  return filterIndexableBlogPosts(sortBlogPostsByDate(catalog));
}

export function getBlogAdjacentPosts(
  post: BlogPost,
  catalog: BlogPost[] = blogPosts,
): BlogAdjacentPosts {
  const ordered = getOrderedPostsForNavigation(post, catalog);
  const index = ordered.findIndex((entry) => entry.slug === post.slug);

  if (index === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: index > 0 ? ordered[index - 1] : null,
    next: index < ordered.length - 1 ? ordered[index + 1] : null,
  };
}
