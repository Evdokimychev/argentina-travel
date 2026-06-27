"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { dedupeGalleryImages } from "@/lib/gallery-images";
import { prefersReducedMotion } from "@/lib/motion";
import { buildSupabaseCdnUrl } from "@/lib/media/cdn-url";
import { SafeImage } from "@/components/ui/safe-image";
import { DetailGalleryLightbox } from "@/components/shared/DetailGalleryLightbox";

type PartnerInfoAutoplayGalleryProps = {
  images: string[];
  title: string;
  className?: string;
};

const SECONDS_PER_TILE = 4.5;

type GalleryTileProps = {
  src: string;
  alt: string;
  index: number;
  priority?: boolean;
  onOpen: (index: number) => void;
};

function GalleryTile({ src, alt, index, priority, onOpen }: GalleryTileProps) {
  return (
    <button
      type="button"
      className={cn(
        "group relative aspect-[4/3] w-[9.25rem] shrink-0 snap-start overflow-hidden rounded-xl",
        "bg-gray-100 ring-1 ring-black/[0.05] shadow-sm",
        "transition-[transform,box-shadow] duration-300 ease-out",
        "hover:scale-[1.03] hover:shadow-md motion-reduce:transform-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2",
        "sm:w-[10.75rem] md:w-[12rem] lg:w-[13rem]",
      )}
      onClick={() => onOpen(index)}
      aria-label={`Открыть фото ${index + 1}`}
    >
      <SafeImage
        src={buildSupabaseCdnUrl(src, { width: 640, quality: 80 })}
        alt={alt}
        fill
        placeholderVariant="tour"
        className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
        sizes="(max-width: 640px) 152px, (max-width: 1024px) 172px, 208px"
        loading={priority ? undefined : "lazy"}
        priority={priority}
      />
    </button>
  );
}

export function PartnerInfoAutoplayGallery({
  images,
  title,
  className,
}: PartnerInfoAutoplayGalleryProps) {
  const galleryImages = dedupeGalleryImages(images.filter(Boolean));
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [paused, setPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef(true);

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  useEffect(() => {
    setReduceMotion(prefersReducedMotion());
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || reduceMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
        setPaused(!entry.isIntersecting);
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduceMotion]);

  if (galleryImages.length < 2) return null;

  const marqueeDuration = galleryImages.length * SECONDS_PER_TILE;
  const marqueeTrack = [...galleryImages, ...galleryImages];

  return (
    <>
      <div
        ref={containerRef}
        className={cn("relative", className)}
        onMouseEnter={() => {
          setPaused(true);
        }}
        onMouseLeave={() => {
          if (isVisibleRef.current) setPaused(false);
        }}
        onFocusCapture={() => {
          setPaused(true);
        }}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null) && isVisibleRef.current) {
            setPaused(false);
          }
        }}
      >
        <div
          className={cn(
            "overflow-hidden rounded-2xl",
            !reduceMotion && "partner-info-gallery-mask",
            reduceMotion && "scrollbar-hide overflow-x-auto overscroll-x-contain",
          )}
          role="region"
          aria-roledescription={reduceMotion ? "галерея" : "бегущая строка"}
          aria-label={`Фото: ${title}`}
        >
          <div
            className={cn(
              "flex w-max gap-3 py-0.5",
              !reduceMotion && "partner-info-gallery-marquee gallery-carousel-autoplay",
              !reduceMotion && paused && "partner-info-gallery-marquee-paused",
            )}
            style={
              reduceMotion
                ? undefined
                : ({ "--marquee-duration": `${marqueeDuration}s` } as CSSProperties)
            }
          >
            {(reduceMotion ? galleryImages : marqueeTrack).map((src, trackIndex) => {
              const imageIndex = trackIndex % galleryImages.length;
              return (
                <GalleryTile
                  key={`${src}-${trackIndex}`}
                  src={src}
                  alt={imageIndex === 0 ? title : `${title} — ${imageIndex + 1}`}
                  index={imageIndex}
                  priority={trackIndex === 0}
                  onOpen={openLightbox}
                />
              );
            })}
          </div>
        </div>

        <div
          className="pointer-events-none absolute bottom-2.5 left-2.5 rounded-full bg-charcoal/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm"
          aria-hidden
        >
          {galleryImages.length} фото
        </div>
      </div>

      {lightboxIndex !== null ? (
        <DetailGalleryLightbox
          images={galleryImages}
          title={title}
          activeIndex={lightboxIndex}
          onActiveIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      ) : null}
    </>
  );
}
