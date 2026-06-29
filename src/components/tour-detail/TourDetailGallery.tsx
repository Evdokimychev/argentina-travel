"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
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

function useGalleryKeyboard(
  enabled: boolean,
  onPrev: () => void,
  onNext: () => void,
  onClose?: () => void
) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        onNext();
      } else if (event.key === "Escape" && onClose) {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onClose, onNext, onPrev]);
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
}: {
  images: string[];
  title: string;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onOpenLightbox: (index: number) => void;
  className?: string;
  priorityFirst?: boolean;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
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
    [images.length, onActiveIndexChange]
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
  }, [activeIndex, images.length, onActiveIndexChange]);

  useGalleryKeyboard(hasMultiple, goPrev, goNext);

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
        {hasMultiple ? `Все фото (${images.length})` : "На весь экран"}
      </button>
    </div>
  );
}

function GalleryThumbnailStrip({
  images,
  title,
  activeIndex,
  onSelect,
  className,
}: {
  images: string[];
  title: string;
  activeIndex: number;
  onSelect: (index: number) => void;
  className?: string;
}) {
  if (images.length <= 1) return null;

  return (
    <div
      className={cn(
        "mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide",
        className,
      )}
      role="tablist"
      aria-label="Миниатюры галереи"
    >
      {images.map((src, index) => (
        <button
          key={`${src}-thumb-${index}`}
          type="button"
          role="tab"
          aria-selected={index === activeIndex}
          aria-label={`Фото ${index + 1} из ${images.length}`}
          onClick={() => onSelect(index)}
          className={cn(
            "relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100 ring-1 ring-gray-100 transition-shadow",
            index === activeIndex && "ring-2 ring-sky shadow-sm"
          )}
        >
          <Image
            src={buildSupabaseCdnUrl(src, { width: 320, quality: 72 })}
            alt={index === 0 ? title : `${title} — ${index + 1}`}
            fill
            className="object-cover"
            sizes="96px"
            loading="lazy"
          />
        </button>
      ))}
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
  const mosaicSeed = layoutSeed ?? title;

  const scrollCarouselToIndex = useCallback((index: number) => {
    setActiveIndex(index);
    const el = carouselScrollRef.current;
    if (!el || el.clientWidth === 0) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  }, []);

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
          images={galleryImages}
          title={title}
          activeIndex={activeIndex}
          onActiveIndexChange={setActiveIndex}
          onOpenLightbox={(index) => {
            setActiveIndex(index);
            setLightbox(true);
          }}
          scrollRef={carouselScrollRef}
          className="h-full"
          priorityFirst
        />
      </div>

      <GalleryThumbnailStrip
        images={galleryImages}
        title={title}
        activeIndex={activeIndex}
        onSelect={scrollCarouselToIndex}
        className="md:hidden"
      />

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
