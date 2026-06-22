import { INLINE_RELATED_EVERY_N, INLINE_RELATED_MAX_BLOCKS } from "@/lib/blog-inline-related";
import type { BlogRichArticle } from "@/types/blog-rich-article";
import type { BlogPost } from "@/types";

export function planInlineRelatedRichSectionIndices(
  sectionCount: number,
  maxBlocks = INLINE_RELATED_MAX_BLOCKS,
): number[] {
  if (sectionCount < 2) return [];

  const indices: number[] = [];
  for (let i = INLINE_RELATED_EVERY_N - 1; i < sectionCount; i += INLINE_RELATED_EVERY_N) {
    indices.push(i);
  }

  return indices.slice(0, maxBlocks);
}

export function buildInlineRelatedForRichArticle(
  post: BlogPost,
  catalog: BlogPost[],
  article: BlogRichArticle,
  getRelatedForSection: (
    context: { sectionTitle: string; sectionBody: string },
    excludeSlugs: Set<string>,
  ) => BlogPost[],
): Map<number, BlogPost[]> {
  const indices = planInlineRelatedRichSectionIndices(article.sections.length);
  const usedSlugs = new Set<string>([post.slug]);
  const result = new Map<number, BlogPost[]>();

  for (const index of indices) {
    const section = article.sections[index];
    if (!section) continue;

    const bodySample = section.blocks
      .flatMap((block) => {
        if (block.type === "paragraphs") return block.items;
        if (block.type === "bullets") return block.items;
        return [];
      })
      .join(" ")
      .slice(0, 800);

    const related = getRelatedForSection(
      { sectionTitle: section.title, sectionBody: bodySample },
      usedSlugs,
    ).filter((entry) => !usedSlugs.has(entry.slug));

    if (related.length === 0) continue;
    result.set(index, related);
    for (const entry of related) usedSlugs.add(entry.slug);
  }

  return result;
}
