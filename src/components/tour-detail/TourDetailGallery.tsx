"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { SafeImage } from "@/components/ui/safe-image";

interface TourDetailGalleryProps {
  images: string[];
  title: string;
}

function GalleryTile({
  src,
  alt,
  className,
  priority,
  onClick,
  children,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("relative overflow-hidden rounded-2xl bg-gray-100", className)}
    >
      <SafeImage
        src={src}
        alt={alt}
        fill
        placeholderVariant="tour"
        className="object-cover transition-transform duration-500 hover:scale-105"
        sizes="(max-width: 768px) 50vw, 40vw"
        priority={priority}
      />
      {children}
    </button>
  );
}

function MobileGalleryCarousel({
  images,
  title,
  activeIndex,
  onActiveIndexChange,
  onOpenLightbox,
}: {
  images: string[];
  title: string;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onOpenLightbox: (index: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
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

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;

    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index >= 0 && index < images.length && index !== activeIndex) {
      onActiveIndexChange(index);
    }
  }, [activeIndex, images.length, onActiveIndexChange]);

  return (
    <div className="relative md:hidden">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="scrollbar-hide flex h-64 snap-x snap-mandatory overflow-x-auto scroll-smooth sm:h-80"
      >
        {images.map((src, index) => (
          <button
            key={`${src}-${index}`}
            type="button"
            onClick={() => onOpenLightbox(index)}
            className="relative h-full min-w-full shrink-0 snap-center snap-always overflow-hidden rounded-2xl bg-gray-100"
          >
            <Image
              src={src}
              alt={index === 0 ? title : `${title} — ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
              sizes="100vw"
            />
          </button>
        ))}
      </div>

      {hasMultiple ? (
        <>
          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex - 1)}
            aria-label="Предыдущее фото"
            className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-charcoal shadow-md backdrop-blur-sm"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex + 1)}
            aria-label="Следующее фото"
            className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-charcoal shadow-md backdrop-blur-sm"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div
            className="pointer-events-none absolute bottom-14 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5"
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
        className="absolute bottom-3 right-3 z-10 rounded-full bg-white px-4 py-2 text-sm font-medium text-charcoal shadow-md"
      >
        Все фото ({images.length})
      </button>
    </div>
  );
}

export default function TourDetailGallery({ images, title }: TourDetailGalleryProps) {
  const [lightbox, setLightbox] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const galleryImages = images.filter(Boolean);

  if (!galleryImages.length) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 md:h-[320px]">
        <p className="text-sm text-slate">Фото тура скоро появятся</p>
      </div>
    );
  }

  const [main, ...rest] = galleryImages;
  const side = rest.slice(0, 4);

  const openLightbox = (index: number) => {
    setActiveIndex(index);
    setLightbox(true);
  };

  const desktopHeight = "md:h-[480px]";

  return (
    <div data-scroll-rail-tone="dark">
      {/* Desktop */}
      <div
        className={cn(
          "hidden gap-2 md:grid md:grid-cols-4 md:grid-rows-2",
          desktopHeight
        )}
      >
        <GalleryTile
          src={main}
          alt={title}
          className="col-span-2 row-span-2"
          priority
          onClick={() => openLightbox(0)}
        />
        {side.map((src, i) => (
          <GalleryTile
            key={src}
            src={src}
            alt={`${title} — ${i + 2}`}
            onClick={() => openLightbox(i + 1)}
          >
            {i === side.length - 1 && galleryImages.length > 5 && (
              <span className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-charcoal shadow-md">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                Показать все ({galleryImages.length})
              </span>
            )}
          </GalleryTile>
        ))}
      </div>

      <MobileGalleryCarousel
        images={galleryImages}
        title={title}
        activeIndex={activeIndex}
        onActiveIndexChange={setActiveIndex}
        onOpenLightbox={openLightbox}
      />

      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-charcoal/95"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between p-4 text-white">
            <span className="text-sm">
              {activeIndex + 1} / {galleryImages.length}
            </span>
            <button
              type="button"
              onClick={() => setLightbox(false)}
              className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
            >
              Закрыть
            </button>
          </div>
          <div className="relative flex-1">
            {galleryImages.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex(
                      (activeIndex - 1 + galleryImages.length) % galleryImages.length
                    )
                  }
                  aria-label="Предыдущее фото"
                  className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 md:left-6"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveIndex((activeIndex + 1) % galleryImages.length)}
                  aria-label="Следующее фото"
                  className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 md:right-6"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            ) : null}
            <Image
              src={galleryImages[activeIndex]}
              alt={`${title} — ${activeIndex + 1}`}
              fill
              className="object-contain p-4"
              sizes="100vw"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto p-4">
            {galleryImages.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg ${i === activeIndex ? "ring-2 ring-sun" : ""}`}
              >
                <Image src={src} alt="" fill className="object-cover" sizes="96px" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
