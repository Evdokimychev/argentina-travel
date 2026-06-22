import { POPULAR_DESTINATIONS } from "@/data/filters";
import type { Destination } from "@/types";
import type { BlogPost } from "@/types";

function haystackForPost(post: BlogPost): string {
  return [
    post.title,
    post.excerpt,
    post.category,
    ...post.tags,
    ...(post.sections ?? []).map((s) => `${s.title} ${s.body}`),
  ]
    .join(" ")
    .toLowerCase();
}

function destinationMatchesPost(dest: Destination, haystack: string): boolean {
  const terms = [dest.name, dest.region, ...dest.keywords];
  return terms.some((term) => haystack.includes(term.toLowerCase()));
}

/** Направления, релевантные статье — из метаданных или эвристики по тексту. */
export function resolveBlogPostDestinations(
  post: BlogPost,
  limit = 6,
): Destination[] {
  const explicit = post.relatedDestinations ?? [];
  if (explicit.length > 0) {
    return explicit
      .map((id) => POPULAR_DESTINATIONS.find((d) => d.id === id))
      .filter((d): d is Destination => d !== undefined)
      .slice(0, limit);
  }

  const haystack = haystackForPost(post);
  return POPULAR_DESTINATIONS.filter((dest) => destinationMatchesPost(dest, haystack)).slice(
    0,
    limit,
  );
}
