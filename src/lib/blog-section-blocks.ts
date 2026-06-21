import { parseBlogSectionBody } from "@/lib/blog-section-body";
import type { BlogPostSection } from "@/types";
import type { BlogBodyBlock } from "@/types/blog-content-blocks";
import { getTypedBlocksForSection } from "@/data/blog-typed-blocks";

/** Merges parsed body blocks with optional typed CMS blocks and slug-level data overrides. */
export function resolveBlogSectionBlocks(
  section: BlogPostSection,
  postSlug?: string,
): BlogBodyBlock[] {
  const parsed = section.body.trim()
    ? parseBlogSectionBody(section.body, section.title, section.blockType)
    : [];

  const external = postSlug ? getTypedBlocksForSection(postSlug, section.title) : undefined;
  const typed = [...(section.blocks ?? []), ...(external ?? [])];

  if (typed.length === 0) return parsed;
  if (parsed.length === 0) return typed;
  return [...parsed, ...typed];
}
