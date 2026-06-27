import type { BlogRichBlock } from "@/types/blog-rich-article";

/** Server-safe guard — keep in sync with BlogRichArticleClientBlock switch. */
export function isBlogRichClientBlock(block: BlogRichBlock): boolean {
  return (
    block.type === "table" ||
    block.type === "faq" ||
    block.type === "gallery" ||
    block.type === "map"
  );
}
