"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { buildSupabaseCdnUrl } from "@/lib/media/cdn-url";
import { ImagePlaceholder, type ImagePlaceholderVariant } from "@/components/ui/image-placeholder";
import { SafeImage } from "@/components/ui/safe-image";
import TourCardImageVignette from "./TourCardImageVignette";

interface TourCardGalleryProps {
  images: string[];
  alt: string;
  variant?: Extract<ImagePlaceholderVariant, "tour" | "excursion">;
}

export default function TourCardGallery({
  images,
  alt,
  variant = "tour",
}: TourCardGalleryProps) {
  const [index, setIndex] = useState(0);
  const displayImages = images
    .map((src) => buildSupabaseCdnUrl(src?.trim() ?? "", { width: 960, quality: 76 }))
    .filter(Boolean);

  if (displayImages.length === 0) {
    return <ImagePlaceholder variant={variant} className="absolute inset-0" label={alt} />;
  }

  const count = displayImages.length;
  const hasMultiple = count > 1;

  function goTo(next: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIndex((next + count) % count);
  }

  return (
    <>
      <SafeImage
        src={displayImages[index]}
        alt={alt}
        fill
        placeholderVariant={variant}
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />

      <TourCardImageVignette />

      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={(e) => goTo(index - 1, e)}
            aria-label="Предыдущее фото"
            className="pointer-events-auto absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-charcoal opacity-100 shadow-sm backdrop-blur-sm transition-opacity hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={(e) => goTo(index + 1, e)}
            aria-label="Следующее фото"
            className="pointer-events-auto absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-charcoal opacity-100 shadow-sm backdrop-blur-sm transition-opacity hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
          </button>

          <div
            className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1"
            aria-hidden
          >
            {displayImages.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "rounded-full bg-white transition-all",
                  i === index ? "h-1.5 w-4 opacity-100" : "h-1.5 w-1.5 opacity-60",
                )}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
