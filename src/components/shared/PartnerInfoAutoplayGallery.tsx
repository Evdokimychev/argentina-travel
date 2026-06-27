"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { dedupeGalleryImages } from "@/lib/gallery-images";
import { prefersReducedMotion } from "@/lib/motion";
import { buildSupabaseCdnUrl } from "@/lib/media/cdn-url";
import { SafeImage } from "@/components/ui/safe-image";

type PartnerInfoAutoplayGalleryProps = {
  images: string[];
  title: string;
  className?: string;
};

const AUTOPLAY_MS = 5500;
const SCROLL_ADVANCE_THROTTLE_MS = 1400;

export function PartnerInfoAutoplayGallery({
  images,
  title,
  className,
}: PartnerInfoAutoplayGalleryProps) {
  const galleryImages = dedupeGalleryImages(images.filter(Boolean));
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef(false);
  const pausedRef = useRef(false);
  const lastScrollAdvanceRef = useRef(0);
  const hasMultiple = galleryImages.length > 1;

  activeIndexRef.current = activeIndex;

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    const nextIndex = (index + galleryImages.length) % galleryImages.length;
    el.scrollTo({
      left: nextIndex * el.clientWidth,
      behavior: prefersReducedMotion() ? "auto" : behavior,
    });
    setActiveIndex(nextIndex);
  }, [galleryImages.length]);

  const advance = useCallback(() => {
    scrollToIndex(activeIndexRef.current + 1);
  }, [scrollToIndex]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index >= 0 && index < galleryImages.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  }, [activeIndex, galleryImages.length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasMultiple || prefersReducedMotion()) return;

    const timer = window.setInterval(() => {
      if (!isVisibleRef.current || pausedRef.current) return;
      advance();
    }, AUTOPLAY_MS);

    return () => window.clearInterval(timer);
  }, [advance, hasMultiple]);

  useEffect(() => {
    if (!hasMultiple || prefersReducedMotion()) return;

    const onPageScroll = () => {
      if (!isVisibleRef.current || pausedRef.current) return;
      const now = Date.now();
      if (now - lastScrollAdvanceRef.current < SCROLL_ADVANCE_THROTTLE_MS) return;
      lastScrollAdvanceRef.current = now;
      advance();
    };

    window.addEventListener("scroll", onPageScroll, { passive: true });
    return () => window.removeEventListener("scroll", onPageScroll);
  }, [advance, hasMultiple]);

  if (galleryImages.length < 2) return null;

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-black/[0.04]", className)}
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
      onFocusCapture={() => {
        pausedRef.current = true;
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          pausedRef.current = false;
        }
      }}
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="scrollbar-hide flex aspect-[16/10] max-h-[280px] w-full snap-x snap-mandatory overflow-x-auto scroll-smooth motion-reduce:scroll-auto overscroll-x-contain sm:max-h-[320px]"
        role="region"
        aria-roledescription="carousel"
        aria-label={`Фото: ${title}`}
        aria-live="polite"
      >
        {galleryImages.map((src, index) => (
          <div
            key={`${src}-info-${index}`}
            className="relative h-full min-w-full shrink-0 snap-center snap-always overflow-hidden"
          >
            <SafeImage
              src={buildSupabaseCdnUrl(src, { width: 1200, quality: 82 })}
              alt={index === 0 ? title : `${title} — ${index + 1}`}
              fill
              placeholderVariant="tour"
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 640px"
              loading={index === 0 ? undefined : "lazy"}
              priority={index === 0}
            />
          </div>
        ))}
      </div>

      {hasMultiple ? (
        <div
          className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-charcoal/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm"
          aria-hidden
        >
          {activeIndex + 1} / {galleryImages.length}
        </div>
      ) : null}

      {hasMultiple ? (
        <div
          className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5"
          aria-hidden
        >
          {galleryImages.map((_, index) => (
            <span
              key={index}
              className={cn(
                "rounded-full bg-white shadow-sm transition-all",
                index === activeIndex ? "h-1.5 w-4 opacity-100" : "h-1.5 w-1.5 opacity-70",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
