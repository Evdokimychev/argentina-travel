import type { BlogBodyBlock } from "@/types/blog-content-blocks";
import type { ContentSection } from "@/types/content-page";

/** Resolves typed CMS blocks for guide sections (no TS slug overrides). */
export function resolveGuideSectionBlocks(section: ContentSection): BlogBodyBlock[] {
  return section.blocks ?? [];
}
