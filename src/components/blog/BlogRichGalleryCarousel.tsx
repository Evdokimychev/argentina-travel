"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { cn } from "@/lib/cn";
import { useSiteHeaderOverlayLock } from "@/hooks/useSiteHeaderOverlayLock";
import { SafeImage } from "@/components/ui/safe-image";

export type BlogGallerySlide = {
  src: string;
  alt: string;
  caption?: string;
  attributionHtml?: string;
  /** Low-res manifest thumbnail for LQIP blur placeholder */
  thumbSrc?: string;
};

type BlogRichGalleryCarouselProps = {
  images: BlogGallerySlide[];
  /** Accessible name for the carousel region */
  ariaLabel?: string;
  className?: string;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function BlogRichGalleryCarousel({
  images,
  ariaLabel = "Фотогалерея",
  className,
}: BlogRichGalleryCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const hasMultiple = images.length > 1;
  const activeSlide = images[activeIndex];

  useSiteHeaderOverlayLock(lightboxOpen);

  const scrollToIndex = useCallback(
    (index: number) => {
      const el = scrollRef.current;
      if (!el) return;

      const nextIndex = hasMultiple ? (index + images.length) % images.length : 0;
      el.scrollTo({
        left: nextIndex * el.clientWidth,
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
      setActiveIndex(nextIndex);
    },
    [hasMultiple, images.length]
  );

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;

    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index >= 0 && index < images.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  }, [activeIndex, images.length]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!hasMultiple) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollToIndex(activeIndex - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollToIndex(activeIndex + 1);
      }
    },
    [activeIndex, hasMultiple, scrollToIndex]
  );

  useEffect(() => {
    if (!lightboxOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const dialog = lightboxRef.current;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxOpen(false);
        returnFocusRef.current?.focus();
        return;
      }
      if (hasMultiple && event.key === "ArrowLeft") {
        event.preventDefault();
        scrollToIndex(activeIndex - 1);
        return;
      }
      if (hasMultiple && event.key === "ArrowRight") {
        event.preventDefault();
        scrollToIndex(activeIndex + 1);
        return;
      }
      if (event.key !== "Tab" || !dialog) return;

      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, hasMultiple, lightboxOpen, scrollToIndex]);

  if (!images.length) return null;

  const activeCaption = activeSlide.caption?.trim();
  const activeAttribution = activeSlide.attributionHtml?.trim();

  return (
    <>
      <figure className={cn("not-prose", className)}>
        <div
          role="region"
          aria-roledescription="carousel"
          aria-label={ariaLabel}
          aria-live={hasMultiple ? "polite" : undefined}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="group/carousel rounded-2xl bg-gradient-to-b from-sky/[0.04] to-white p-1 shadow-md ring-1 ring-gray-100"
        >
          <div className="relative overflow-hidden rounded-[calc(theme(borderRadius.2xl)-4px)] bg-charcoal/5">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className={cn(
                "scrollbar-hide flex aspect-[16/10] max-h-[400px] w-full snap-x snap-mandatory overflow-x-auto scroll-smooth motion-reduce:scroll-auto overscroll-x-contain md:max-h-[480px]",
                hasMultiple && "cursor-grab active:cursor-grabbing"
              )}
            >
              {images.map((image, index) => (
                <button
                  key={`${image.src}-${index}`}
                  type="button"
                  onClick={(event) => {
                    returnFocusRef.current = event.currentTarget;
                    setLightboxOpen(true);
                  }}
                  className="relative h-full min-w-full shrink-0 snap-center snap-always overflow-hidden"
                  aria-label={`Открыть фото ${index + 1} в полном размере`}
                >
                  {image.thumbSrc ? (
                    <SafeImage
                      src={image.thumbSrc}
                      alt=""
                      fill
                      aria-hidden
                      className="object-cover scale-105 blur-lg"
                      sizes="96px"
                      loading={index === 0 ? undefined : "lazy"}
                      blurPlaceholder={false}
                      placeholderVariant="destination"
                    />
                  ) : null}
                  <SafeImage
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover/carousel:scale-[1.02] motion-reduce:transform-none motion-reduce:transition-none"
                    sizes="(max-width: 768px) 100vw, 720px"
                    loading={index === 0 ? undefined : "lazy"}
                    priority={index === 0}
                    placeholderVariant="destination"
                    blurPlaceholder={!image.thumbSrc}
                  />
                  <span
                    className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-charcoal opacity-0 shadow-sm backdrop-blur-sm transition-opacity duration-200 group-hover/carousel:opacity-100"
                    aria-hidden
                  >
                    <Expand className="h-3.5 w-3.5" />
                    Увеличить
                  </span>
                </button>
              ))}
            </div>

            {hasMultiple ? (
              <>
                <button
                  type="button"
                  onClick={() => scrollToIndex(activeIndex - 1)}
                  aria-label="Предыдущее фото"
                  className="blog-interactive-target absolute left-3 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-charcoal shadow-md backdrop-blur-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToIndex(activeIndex + 1)}
                  aria-label="Следующее фото"
                  className="blog-interactive-target absolute right-3 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-charcoal shadow-md backdrop-blur-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                <div
                  className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-full bg-charcoal/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {activeIndex + 1} / {images.length}
                </div>
              </>
            ) : null}
          </div>

          {hasMultiple ? (
            <div
              className="mt-3 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide"
              role="tablist"
              aria-label="Миниатюры галереи"
            >
              {images.map((image, index) => (
                <button
                  key={`thumb-${image.src}-${index}`}
                  type="button"
                  role="tab"
                  aria-selected={index === activeIndex}
                  aria-label={`Фото ${index + 1}`}
                  onClick={() => scrollToIndex(index)}
                  className={cn(
                    "blog-interactive-target relative shrink-0 overflow-hidden rounded-xl bg-charcoal/5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 sm:h-16 sm:w-24",
                    "h-11 w-[4.75rem]",
                    index === activeIndex
                      ? "ring-2 ring-sky shadow-sm"
                      : "ring-1 ring-gray-200 opacity-80 hover:opacity-100"
                  )}
                >
                  <SafeImage
                    src={image.src}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="96px"
                    loading="lazy"
                    placeholderVariant="destination"
                    blurPlaceholder={false}
                  />
                </button>
              ))}
            </div>
          ) : null}

        </div>

        {activeCaption || activeAttribution ? (
          <figcaption className="mt-3 space-y-1.5 text-center">
            {activeCaption ? (
              <p className="text-sm leading-relaxed text-slate">{activeCaption}</p>
            ) : (
              <p className="sr-only">{activeSlide.alt}</p>
            )}
            {activeAttribution ? (
              <p
                className="text-xs text-slate/70"
                dangerouslySetInnerHTML={{ __html: activeAttribution }}
              />
            ) : null}
          </figcaption>
        ) : (
          <figcaption className="sr-only">{activeSlide.alt}</figcaption>
        )}
      </figure>

      {lightboxOpen ? (
        <div
          ref={lightboxRef}
          className="fixed inset-0 z-[100] flex flex-col bg-charcoal/95"
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр фото"
        >
          <div className="flex items-center justify-between p-4 text-white">
            <span className="text-sm tabular-nums">
              {activeIndex + 1} / {images.length}
            </span>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => {
                setLightboxOpen(false);
                returnFocusRef.current?.focus();
              }}
              className="min-h-[44px] rounded-full bg-white/10 px-4 py-2 text-sm transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              Закрыть
            </button>
          </div>

          <div className="relative flex-1 min-h-0">
            {hasMultiple ? (
              <>
                <button
                  type="button"
                  onClick={() => scrollToIndex(activeIndex - 1)}
                  aria-label="Предыдущее фото"
                  className="blog-interactive-target absolute left-3 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 md:left-6"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToIndex(activeIndex + 1)}
                  aria-label="Следующее фото"
                  className="blog-interactive-target absolute right-3 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 md:right-6"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            ) : null}

            <SafeImage
              src={activeSlide.src}
              alt={activeSlide.alt}
              fill
              className="object-contain p-4 md:p-8"
              sizes="100vw"
              priority
              placeholderVariant="destination"
              blurPlaceholder={false}
            />
          </div>

          {activeCaption || activeAttribution ? (
            <div className="space-y-1.5 px-4 pb-4 text-center">
              {activeCaption ? (
                <p className="text-sm text-white/80">{activeCaption}</p>
              ) : null}
              {activeAttribution ? (
                <p
                  className="text-xs text-white/60"
                  dangerouslySetInnerHTML={{ __html: activeAttribution }}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
