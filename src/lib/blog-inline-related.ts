import { getBlogSectionKind } from "@/lib/blog-section-body";
import type { BlogPost, BlogPostSection } from "@/types";

export const INLINE_RELATED_MAX_BLOCKS = 3;
export const INLINE_RELATED_EVERY_N = 3;

const PRIORITY_KINDS = new Set(["faq", "checklist", "mistakes", "tips"]);

/** Индексы секций, после которых вставляем компактный блок «Читайте также». */
export function planInlineRelatedSections(
  sections: BlogPostSection[],
  maxBlocks = INLINE_RELATED_MAX_BLOCKS,
): number[] {
  if (sections.length < 2) return [];

  const kinds = sections.map((section) =>
    getBlogSectionKind(section.title, section.blockType),
  );

  const candidates: number[] = [];

  for (let i = 0; i < sections.length; i++) {
    if (PRIORITY_KINDS.has(kinds[i])) candidates.push(i);
  }

  for (let i = INLINE_RELATED_EVERY_N - 1; i < sections.length; i += INLINE_RELATED_EVERY_N) {
    if (!candidates.includes(i)) candidates.push(i);
  }

  return candidates.slice(0, maxBlocks);
}

export function buildInlineRelatedPostsBySection(
  post: BlogPost,
  catalog: BlogPost[],
  sections: BlogPostSection[],
  getRelatedForSection: (
    context: { section: BlogPostSection; index: number },
    excludeSlugs: Set<string>,
  ) => BlogPost[],
): Map<number, BlogPost[]> {
  const indices = planInlineRelatedSections(sections);
  const usedSlugs = new Set<string>([post.slug]);
  const result = new Map<number, BlogPost[]>();

  for (const index of indices) {
    const related = getRelatedForSection(
      { section: sections[index], index },
      usedSlugs,
    ).filter((entry) => !usedSlugs.has(entry.slug));

    if (related.length === 0) continue;

    result.set(index, related);
    for (const entry of related) usedSlugs.add(entry.slug);
  }

  return result;
}
