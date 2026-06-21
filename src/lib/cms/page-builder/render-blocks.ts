/**
 * Maps CMS page-builder blocks to public RenderBlocks-style dispatch.
 * Re-exports BlogSectionBody renderer — single source of truth for block → UI.
 */
export { renderBlogBodyBlock as renderPageBuilderBlock } from "@/components/blog/BlogSectionBody";
export type { BlogBodyBlock as PageBuilderBlock } from "@/types/blog-content-blocks";
export {
  PAGE_BUILDER_BLOCKS,
  createPageBuilderBlock,
  blockDefinitionFor,
} from "@/lib/cms/page-builder/block-registry";
