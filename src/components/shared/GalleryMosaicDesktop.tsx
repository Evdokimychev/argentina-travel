"use client";

import { useMemo } from "react";
import { Images } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { cn } from "@/lib/cn";
import {
  buildGalleryMosaicPlan,
  mosaicCellStyle,
} from "@/lib/media-detail-gallery-layout";
import { buildSupabaseCdnUrl } from "@/lib/media/cdn-url";
import { tourDetailGalleryGridClass } from "@/lib/tour-detail-ui";

type GalleryMosaicDesktopProps = {
  images: string[];
  title: string;
  seed: string;
  onOpenLightbox: (index: number) => void;
  className?: string;
};

export function GalleryMosaicDesktop({
  images,
  title,
  seed,
  onOpenLightbox,
  className,
}: GalleryMosaicDesktopProps) {
  const plan = useMemo(
    () => buildGalleryMosaicPlan(images, seed),
    [images, seed],
  );

  const { layout, slots, images: mosaicImages } = plan;
  const hasMultiple = mosaicImages.length > 1;

  return (
    <div
      className={cn(
        tourDetailGalleryGridClass,
        className,
      )}
      style={{
        gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${layout.rows}, minmax(0, 1fr))`,
      }}
      role={hasMultiple ? "region" : undefined}
      aria-label={hasMultiple ? "Галерея фото" : undefined}
    >
      {slots.map(({ cell, imageIndex }, slotIndex) => {
        const src = mosaicImages[imageIndex];
        if (!src) return null;

        return (
          <button
            key={`${layout.id}-${slotIndex}-${imageIndex}`}
            type="button"
            onClick={() => onOpenLightbox(imageIndex)}
            style={mosaicCellStyle(cell)}
            className="group relative min-h-0 overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-black/[0.04] transition-[transform,box-shadow] duration-200 hover:z-[1] hover:shadow-md motion-reduce:transition-none"
          >
            <SafeImage
              src={buildSupabaseCdnUrl(src, { width: cell.colEnd - cell.colStart >= 2 ? 1200 : 720, quality: 82 })}
              alt={imageIndex === 0 ? title : `${title} — ${imageIndex + 1}`}
              fill
              placeholderVariant="tour"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transform-none"
              priority={slotIndex === 0}
              sizes="(min-width: 768px) 50vw, 100vw"
            />
            <span className="pointer-events-none absolute inset-0 bg-charcoal/0 transition-colors group-hover:bg-charcoal/[0.06]" />

            {cell.showAllOverlay && hasMultiple ? (
              <span className="pointer-events-none absolute bottom-0 right-0 inline-flex items-center gap-2 rounded-tl-2xl bg-white/95 px-4 py-2.5 text-sm font-medium text-charcoal shadow-md backdrop-blur-sm">
                <Images className="h-4 w-4 text-sky" strokeWidth={1.75} aria-hidden />
                Все фото ({mosaicImages.length})
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
