"use client";

import { useCallback, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { dedupeGalleryImages } from "@/lib/gallery-images";
import { buildSupabaseCdnUrl } from "@/lib/media/cdn-url";
import { SafeImage } from "@/components/ui/safe-image";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { tourDetailGalleryMobileAspectClass } from "@/lib/tour-detail-ui";
import { DetailGalleryLightbox } from "@/components/shared/DetailGalleryLightbox";
import { GalleryMosaicDesktop } from "@/components/shared/GalleryMosaicDesktop";

interface TourDetailGalleryProps {
  images: string[];
  title: string;
  /** Stable key for mosaic layout (slug). Falls back to title. */
  layoutSeed?: string;
}

function GalleryCarousel({
  images,
  title,
  activeIndex,
  onActiveIndexChange,
  onOpenLightbox,
  className,
  priorityFirst = false,
  scrollRef: externalScrollRef,
  totalImageCount,
}: {
  images: string[];
  title: string;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onOpenLightbox: (index: number) => void;
  className?: string;
  priorityFirst?: boolean;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  totalImageCount?: number;
}) {
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const scrollRef = externalScrollRef ?? internalScrollRef;
  const hasMultiple = images.length > 1;

  const scrollToIndex = useCallback(
    (index: number) => {
      const el = scrollRef.current;
      if (!el) return;
      const nextIndex = (index + images.length) % images.length;
      el.scrollTo({ left: nextIndex * el.clientWidth, behavior: "smooth" });
      onActiveIndexChange(nextIndex);
    },
    [images.length, onActiveIndexChange, scrollRef]
  );

  const goPrev = useCallback(() => scrollToIndex(activeIndex - 1), [activeIndex, scrollToIndex]);
  const goNext = useCallback(() => scrollToIndex(activeIndex + 1), [activeIndex, scrollToIndex]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index >= 0 && index < images.length && index !== activeIndex) {
      onActiveIndexChange(index);
    }
  }, [activeIndex, images.length, onActiveIndexChange, scrollRef]);

  return (
    <div
      className={cn("relative", className)}
      tabIndex={hasMultiple ? 0 : undefined}
      role={hasMultiple ? "region" : undefined}
      aria-label={hasMultiple ? "Галерея тура" : undefined}
      onKeyDown={
        hasMultiple
          ? (event) => {
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                goPrev();
              } else if (event.key === "ArrowRight") {
                event.preventDefault();
                goNext();
              }
            }
          : undefined
      }
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="scrollbar-hide flex h-full snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-2xl"
      >
        {images.map((src, index) => (
          <button
            key={`${src}-${index}`}
            type="button"
            onClick={() => onOpenLightbox(index)}
            className="relative h-full min-w-full shrink-0 snap-center snap-always overflow-hidden rounded-2xl bg-gray-100"
          >
            <SafeImage
              src={buildSupabaseCdnUrl(src, { width: 1440, quality: 82 })}
              alt={index === 0 ? title : `${title} — ${index + 1}`}
              fill
              placeholderVariant="tour"
              className="object-cover"
              priority={priorityFirst && index === 0}
              sizes="100vw"
            />
          </button>
        ))}
      </div>

      {hasMultiple ? (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Предыдущее фото"
            className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-charcoal shadow-md backdrop-blur-sm transition-opacity hover:bg-white motion-reduce:transition-none"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Следующее фото"
            className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-charcoal shadow-md backdrop-blur-sm transition-opacity hover:bg-white motion-reduce:transition-none"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div
            className="pointer-events-none absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5"
            aria-hidden
          >
            {images.map((_, index) => (
              <span
                key={index}
                className={cn(
                  "rounded-full bg-white shadow-sm transition-all",
                  index === activeIndex ? "h-1.5 w-4 opacity-100" : "h-1.5 w-1.5 opacity-70"
                )}
              />
            ))}
          </div>
        </>
      ) : null}

      <button
        type="button"
        onClick={() => onOpenLightbox(activeIndex)}
        className="absolute bottom-3 right-3 z-10 min-h-[44px] rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-charcoal shadow-md backdrop-blur-sm"
      >
        {hasMultiple ? `Все фото (${totalImageCount ?? images.length})` : "На весь экран"}
      </button>
    </div>
  );
}

export default function TourDetailGallery({
  images,
  title,
  layoutSeed,
}: TourDetailGalleryProps) {
  const [lightbox, setLightbox] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselScrollRef = useRef<HTMLDivElement>(null);
  const galleryImages = dedupeGalleryImages(images.filter(Boolean));
  const mobileGalleryImages = galleryImages.slice(0, 12);
  const mobileActiveIndex = Math.min(activeIndex, Math.max(0, mobileGalleryImages.length - 1));
  const mosaicSeed = layoutSeed ?? title;

  if (!galleryImages.length) {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-dashed border-gray-200",
          tourDetailGalleryMobileAspectClass,
        )}
      >
        <ImagePlaceholder className="h-full min-h-[12rem]" ariaLabel={title} />
      </div>
    );
  }

  return (
    <div data-scroll-rail-tone="dark">
      <div className={cn("w-full md:hidden", tourDetailGalleryMobileAspectClass)}>
        <GalleryCarousel
          images={mobileGalleryImages}
          title={title}
          activeIndex={mobileActiveIndex}
          onActiveIndexChange={setActiveIndex}
          onOpenLightbox={(index) => {
            setActiveIndex(index);
            setLightbox(true);
          }}
          scrollRef={carouselScrollRef}
          totalImageCount={galleryImages.length}
          className="h-full"
          priorityFirst
        />
      </div>

      <GalleryMosaicDesktop
        images={galleryImages}
        title={title}
        seed={mosaicSeed}
        onOpenLightbox={(index) => {
          setActiveIndex(index);
          setLightbox(true);
        }}
      />

      {lightbox ? (
        <DetailGalleryLightbox
          images={galleryImages}
          title={title}
          activeIndex={activeIndex}
          onActiveIndexChange={setActiveIndex}
          onClose={() => setLightbox(false)}
          ariaLabel="Просмотр фото тура"
        />
      ) : null}
    </div>
  );
}
