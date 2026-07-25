"use client";

import Link from "next/link";
import { BlogRichGalleryCarousel } from "@/components/blog/BlogRichGalleryCarousel";
import { mediaUrl } from "@/lib/media/media-cdn";
import { cn } from "@/lib/cn";
import type { BlogGalleryItem } from "@/types/blog-content-blocks";
import Image from "next/image";

type Props = {
  items: BlogGalleryItem[];
  columns?: 2 | 3 | 4;
  layout?: "carousel" | "grid" | "auto";
  ariaLabel?: string;
  className?: string;
};

/**
 * Переиспользуемая галерея для статей, page builder и редактора.
 * 2+ фото → карусель с листанием и lightbox; одно фото или layout=grid → плитка.
 */
export default function BlogGalleryBlock({
  items,
  columns = 3,
  layout = "auto",
  ariaLabel = "Фотогалерея",
  className,
}: Props) {
  const filtered = items.filter((item) => item.src.trim());
  if (filtered.length === 0) return null;

  const useCarousel =
    layout === "carousel" || (layout === "auto" && filtered.length > 1);

  if (useCarousel) {
    return (
      <BlogRichGalleryCarousel
        className={className}
        ariaLabel={ariaLabel}
        images={filtered.map((item) => ({
          src: item.src,
          alt: item.alt || "Фото",
          caption: item.caption,
        }))}
      />
    );
  }

  return (
    <div
      className={cn(
        "grid gap-3",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {filtered.map((item, index) => (
        <figure
          key={`${item.src}-${index}`}
          className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
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

type LinkChipsProps = {
  title?: string;
  items: Array<{ label: string; href: string; emoji?: string }>;
  className?: string;
};

/** Чипы направлений/тем — явная навигация вместо случайной автоперелинковки в тексте. */
export function BlogLinkChipsBlock({ title, items, className }: LinkChipsProps) {
  const filtered = items.filter((item) => item.label.trim() && item.href.trim());
  if (filtered.length === 0) return null;

  return (
    <nav
      className={cn("rounded-2xl border border-gray-100 bg-surface-muted/40 p-4 sm:p-5", className)}
      aria-label={title?.trim() || "Ссылки по теме"}
    >
      {title?.trim() ? (
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate">{title}</p>
      ) : null}
      <ul className={cn("flex flex-wrap gap-2", title?.trim() && "mt-3")}>
        {filtered.map((item) => (
          <li key={`${item.href}-${item.label}`}>
            <Link
              href={item.href}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-charcoal shadow-sm transition hover:border-sky/40 hover:text-sky"
            >
              {item.emoji ? <span aria-hidden>{item.emoji}</span> : null}
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
