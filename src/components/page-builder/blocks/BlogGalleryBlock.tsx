"use client";

import Image from "next/image";
import { mediaUrl } from "@/lib/media-resolver";
import { cn } from "@/lib/cn";
import type { BlogGalleryItem } from "@/types/blog-content-blocks";

type Props = {
  items: BlogGalleryItem[];
  columns?: 2 | 3 | 4;
};

export default function BlogGalleryBlock({ items, columns = 3 }: Props) {
  const filtered = items.filter((item) => item.src.trim());
  if (filtered.length === 0) return null;

  return (
    <div
      className={cn(
        "grid gap-3",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "grid-cols-2 lg:grid-cols-4"
      )}
    >
      {filtered.map((item, index) => (
        <figure key={`${item.src}-${index}`} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="relative aspect-[4/3]">
            <Image
              src={mediaUrl(item.src)}
              alt={item.alt || "Галерея"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
          {item.caption ? (
            <figcaption className="px-3 py-2 text-xs text-slate">{item.caption}</figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  );
}
