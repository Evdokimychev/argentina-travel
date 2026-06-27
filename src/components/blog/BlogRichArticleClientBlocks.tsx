"use client";

import dynamic from "next/dynamic";
import BlogContentTable from "@/components/blog/BlogContentTable";
import BlogFaqSection from "@/components/blog/BlogFaqSection";
import { BlogRichGalleryCarousel } from "@/components/blog/BlogRichGalleryCarousel";

const BlogMapBlock = dynamic(() => import("@/components/blog/BlogMapBlock"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[200px] items-center justify-center rounded-2xl border border-gray-100 bg-surface-muted text-sm text-slate sm:h-[240px]">
      Загрузка карты…
    </div>
  ),
});
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
