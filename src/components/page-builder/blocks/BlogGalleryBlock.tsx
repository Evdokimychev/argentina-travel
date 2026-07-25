"use client";

import Image from "next/image";
import { mediaUrl } from "@/lib/media/media-cdn";
import { cn } from "@/lib/cn";
import type { BlogGalleryItem, BlogGalleryVariant } from "@/types/blog-content-blocks";

type Props = {
  items: BlogGalleryItem[];
  columns?: 2 | 3 | 4;
  variant?: BlogGalleryVariant;
};

export default function BlogGalleryBlock({ items, columns = 3, variant = "grid" }: Props) {
  const filtered = items.filter((item) => item.src.trim());
  if (filtered.length === 0) return null;

  if (variant === "filmstrip" || variant === "carousel") {
    return (
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {filtered.map((item, index) => (
          <figure
            key={`${item.src}-${index}`}
            className="w-[min(280px,80vw)] shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
          >
            <div className="relative aspect-[4/3]">
              <Image
                src={mediaUrl(item.src)}
                alt={item.alt || "Галерея"}
                fill
                className="object-cover"
                sizes="280px"
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

  return (
    <div
      className={cn(
        "grid gap-3",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "grid-cols-2 lg:grid-cols-4",
        variant === "comparison" && "sm:grid-cols-2",
        variant === "location" && "gap-4",
      )}
    >
      {filtered.map((item, index) => (
        <figure
          key={`${item.src}-${index}`}
          className={cn(
            "overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm",
            variant === "location" && "ring-1 ring-sky/10",
          )}
        >
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
