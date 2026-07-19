"use client";

import { useState } from "react";
import { Maximize2 } from "lucide-react";
import { DetailGalleryLightbox } from "@/components/shared/DetailGalleryLightbox";
import { SafeImage } from "@/components/ui/safe-image";
import { cn } from "@/lib/cn";
import type { ImagePlaceholderVariant } from "@/components/ui/image-placeholder";

type DetailPhotoGalleryProps = {
  images: string[];
  title: string;
  altForImage: (index: number) => string;
  className?: string;
  imageClassName?: string;
  placeholderVariant?: ImagePlaceholderVariant;
};

export default function DetailPhotoGallery({
  images,
  title,
  altForImage,
  className,
  imageClassName,
  placeholderVariant = "generic",
}: DetailPhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const uniqueImages = [...new Set(images.filter(Boolean))];

  if (uniqueImages.length === 0) return null;

  const hasMultiple = uniqueImages.length > 1;

  return (
    <>
      <div
        className={cn(
          "flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 scrollbar-hide sm:grid sm:overflow-visible sm:pb-0",
          hasMultiple ? "sm:grid-cols-3" : "max-w-3xl sm:block",
          className,
        )}
        aria-label={hasMultiple ? `Фотографии: ${title}` : undefined}
      >
        {uniqueImages.map((src, index) => (
          <button
            key={src}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={cn(
              "group relative block shrink-0 snap-center overflow-hidden rounded-card bg-surface-muted text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 motion-reduce:transform-none sm:w-auto",
              hasMultiple ? "w-[88%]" : "w-full",
              index === 0 && hasMultiple ? "sm:col-span-2 sm:row-span-2" : "",
            )}
            aria-label={`Открыть фото ${index + 1} из ${uniqueImages.length}: ${title}`}
          >
            <span
              className={cn(
                "relative block overflow-hidden",
                index === 0 && hasMultiple ? "aspect-[16/10] sm:h-full" : "aspect-[4/3]",
              )}
            >
              <SafeImage
                src={src}
                alt={altForImage(index)}
                fill
                className={cn(
                  "object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none",
                  imageClassName,
                )}
                sizes={index === 0 && hasMultiple ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
                placeholderVariant={placeholderVariant}
              />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/55 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-charcoal/65 px-3 py-1.5 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                <Maximize2 className="h-3.5 w-3.5" aria-hidden />
                Открыть
              </span>
            </span>
          </button>
        ))}
      </div>

      {activeIndex != null ? (
        <DetailGalleryLightbox
          images={uniqueImages}
          title={title}
          activeIndex={activeIndex}
          onActiveIndexChange={setActiveIndex}
          onClose={() => setActiveIndex(null)}
          ariaLabel={`Галерея: ${title}`}
        />
      ) : null}
    </>
  );
}
