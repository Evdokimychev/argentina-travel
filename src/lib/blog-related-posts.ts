import { getBlogHubsForPost, postMatchesBlogHub } from "@/data/blog-hubs";
import { filterIndexableBlogPosts } from "@/lib/blog-utils";
import type { BlogPost } from "@/types";

const SHARED_HUB_SCORE = 10;
const RELATED_RESOURCE_SCORE = 8;
const CATEGORY_MATCH_SCORE = 3;
const CATEGORY_ONLY_PENALTY = 2;
const RICH_PAIR_SCORE = 1;

function tagOverlapScore(a: BlogPost, b: BlogPost): number {
  const tagsB = new Set(b.tags);
  return a.tags.reduce((sum, tag) => sum + (tagsB.has(tag) ? 1 : 0), 0);
}

function extractBlogSlugFromHref(href: string): string | null {
  const match = href.match(/^\/blog\/([^/?#]+)$/);
  return match?.[1] ?? null;
}

function getExplicitRelatedSlugs(post: BlogPost): Set<string> {
  const slugs = new Set<string>();
  for (const resource of post.relatedResources ?? []) {
    const slug = extractBlogSlugFromHref(resource.href);
    if (slug) slugs.add(slug);
  }
  return slugs;
}

function sharesHub(a: BlogPost, b: BlogPost): boolean {
  return getBlogHubsForPost(a).some((hub) => postMatchesBlogHub(b, hub));
}

function isExplicitlyRelated(source: BlogPost, candidate: BlogPost): boolean {
  const slugs = getExplicitRelatedSlugs(source);
  if (slugs.has(candidate.slug)) return true;

  for (const resource of candidate.relatedResources ?? []) {
    const slug = extractBlogSlugFromHref(resource.href);
    if (slug === source.slug) return true;
  }

  return false;
}

/** 3–4 indexable-статьи по хабу, relatedResources, категории и тегам */
export function getRelatedBlogPosts(
  post: BlogPost,
  posts: BlogPost[],
  limit = 4,
): BlogPost[] {
  return scoreRelatedCandidates(post, posts, {}, limit);
}

export type SectionRelatedContext = {
  sectionTitle: string;
  sectionBody?: string;
  sectionKind?: string;
};

const SECTION_TITLE_SCORE = 4;
const SECTION_BODY_TERM_SCORE = 2;
const ITINERARY_KIND_BOOST = 5;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4);
}

function sectionContextScore(context: SectionRelatedContext, candidate: BlogPost): number {
  let score = 0;
  const titleTokens = tokenize(context.sectionTitle);
  const bodyTokens = context.sectionBody ? tokenize(context.sectionBody.slice(0, 600)) : [];
  const candidateHaystack = `${candidate.title} ${candidate.excerpt} ${candidate.tags.join(" ")}`.toLowerCase();

  for (const token of titleTokens) {
    if (candidateHaystack.includes(token)) score += SECTION_TITLE_SCORE;
  }

  for (const token of bodyTokens.slice(0, 20)) {
    if (candidateHaystack.includes(token)) score += SECTION_BODY_TERM_SCORE;
  }

  if (
    context.sectionKind === "checklist" &&
    (candidate.slug.includes("checklist") || candidate.slug.includes("чек-лист"))
  ) {
    score += ITINERARY_KIND_BOOST;
  }

  if (
    context.sectionKind === "mistakes" &&
    (candidate.slug.includes("ошиб") || candidate.tags.some((tag) => tag.includes("ошиб")))
  ) {
    score += ITINERARY_KIND_BOOST;
  }

  if (context.sectionKind === "faq" && candidate.tags.some((tag) => /faq|вопрос/i.test(tag))) {
    score += 2;
  }

  return score;
}

function scoreRelatedCandidates(
  post: BlogPost,
  posts: BlogPost[],
  context: SectionRelatedContext,
  limit: number,
  excludeSlugs: Set<string> = new Set([post.slug]),
): BlogPost[] {
  const candidates = filterIndexableBlogPosts(posts).filter(
    (p) => p.slug !== post.slug && !excludeSlugs.has(p.slug),
  );
  if (candidates.length === 0) return [];

  const scored = candidates.map((candidate) => {
    const tagScore = tagOverlapScore(post, candidate);
    let score = tagScore + sectionContextScore(context, candidate);

    if (candidate.category === post.category) {
      score += CATEGORY_MATCH_SCORE;
      if (tagScore === 0) score -= CATEGORY_ONLY_PENALTY;
    }

    if (sharesHub(post, candidate)) score += SHARED_HUB_SCORE;
    if (isExplicitlyRelated(post, candidate)) score += RELATED_RESOURCE_SCORE;
    if (candidate.richArticleId && post.richArticleId) score += RICH_PAIR_SCORE;

    return { candidate, score };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.candidate.date).getTime() - new Date(a.candidate.date).getTime();
  });

  const withScore = scored.filter(({ score }) => score > 0).map(({ candidate }) => candidate);
  if (withScore.length >= limit) return withScore.slice(0, limit);

  const fallback = scored.map(({ candidate }) => candidate);
  const seen = new Set(withScore.map((p) => p.slug));
  for (const item of fallback) {
    if (withScore.length >= limit) break;
    if (!seen.has(item.slug)) {
      withScore.push(item);
      seen.add(item.slug);
    }
  }

  return withScore.slice(0, limit);
}

/** 1–2 статьи с учётом контекста секции для inline-блоков. */
export function getRelatedBlogPostsForSection(
  post: BlogPost,
  posts: BlogPost[],
  context: SectionRelatedContext,
  excludeSlugs: Set<string> = new Set([post.slug]),
  limit = 2,
): BlogPost[] {
  return scoreRelatedCandidates(post, posts, context, limit, excludeSlugs);
}
