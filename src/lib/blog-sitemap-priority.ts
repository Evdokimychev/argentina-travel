import { BLOG_START_HERE_SLUGS } from "@/data/blog-canonical-map";
import type { BlogPost } from "@/types";

const PILLAR_SLUGS = new Set<string>([
  ...BLOG_START_HERE_SLUGS,
  "itinerary-за-10-дней",
  "itinerary-за-14-дней",
  "itinerary-чек-лист",
  "itinerary-ошибки",
  "patagoniya-marshrut-14-dney",
  "natsionalnye-parki-argentiny",
]);

/** pillar > rich > hub > editorial override > прочие indexable */
export function getBlogSitemapPriority(path: string, postsBySlug: Map<string, BlogPost>): number | undefined {
  if (path === "/blog") return 0.85;

  const hubMatch = path.match(/^\/blog\/hub\/[^/]+$/);
  if (hubMatch) return 0.72;

  const postMatch = path.match(/^\/blog\/([^/]+)$/);
  if (!postMatch) return undefined;

  const post = postsBySlug.get(postMatch[1]);
  if (!post) return 0.5;

  if (PILLAR_SLUGS.has(post.slug)) return 0.88;
  if (post.richArticleId) return 0.82;
  if (post.editorialReviewed) return 0.62;
  return 0.55;
}
