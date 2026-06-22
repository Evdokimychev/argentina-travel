"use client";

import BlogContentTable from "@/components/blog/BlogContentTable";
import BlogFaqSection from "@/components/blog/BlogFaqSection";
import BlogMapBlock from "@/components/blog/BlogMapBlock";
import { BlogRichGalleryCarousel } from "@/components/blog/BlogRichGalleryCarousel";
import type { BlogRichBlock } from "@/types/blog-rich-article";

export function BlogRichGallerySection({
  images,
  ariaLabel,
}: {
  images: Array<{ src: string; alt: string; caption?: string }>;
  ariaLabel: string;
}) {
  if (images.length === 0) return null;
  return <BlogRichGalleryCarousel images={images} ariaLabel={ariaLabel} />;
}

export default function BlogRichArticleClientBlock({ block }: { block: BlogRichBlock }) {
  switch (block.type) {
    case "table":
      return <BlogContentTable headers={block.headers} rows={block.rows} caption={block.caption} />;
    case "faq":
      return <BlogFaqSection items={block.items} />;
    case "gallery":
      return (
        <BlogRichGalleryCarousel
          images={block.images.map((image) => ({
            src: image.src,
            alt: image.alt,
            caption: image.title,
          }))}
          ariaLabel="Галерея в статье"
        />
      );
    case "map":
      return <BlogMapBlock lat={block.lat} lng={block.lng} label={block.label} />;
    default:
      return null;
  }
}

export function isBlogRichClientBlock(block: BlogRichBlock): boolean {
  return block.type === "table" || block.type === "faq" || block.type === "gallery" || block.type === "map";
}
