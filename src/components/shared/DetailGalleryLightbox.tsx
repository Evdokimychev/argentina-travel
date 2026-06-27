"use client";

import { useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useSiteHeaderOverlayLock } from "@/hooks/useSiteHeaderOverlayLock";
import { buildSupabaseCdnUrl } from "@/lib/media/cdn-url";
import { SafeImage } from "@/components/ui/safe-image";

type DetailGalleryLightboxProps = {
  images: string[];
  title: string;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onClose: () => void;
  ariaLabel?: string;
};

const SWIPE_THRESHOLD_PX = 48;

export function DetailGalleryLightbox({
  images,
  title,
  activeIndex,
  onActiveIndexChange,
  onClose,
  ariaLabel = "Просмотр фото",
}: DetailGalleryLightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const hasMultiple = images.length > 1;

  useSiteHeaderOverlayLock(true);

  const goPrev = useCallback(() => {
    onActiveIndexChange((activeIndex - 1 + images.length) % images.length);
  }, [activeIndex, images.length, onActiveIndexChange]);

  const goNext = useCallback(() => {
    onActiveIndexChange((activeIndex + 1) % images.length);
  }, [activeIndex, images.length, onActiveIndexChange]);

  useEffect(() => {
    closeButtonRef.current?.focus();

    const dialog = dialogRef.current;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (hasMultiple && event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
        return;
      }
      if (hasMultiple && event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
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
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, hasMultiple, onClose]);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    touchStartXRef.current = event.changedTouches[0]?.clientX ?? null;
  }, []);

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      if (!hasMultiple || touchStartXRef.current == null) return;
      const endX = event.changedTouches[0]?.clientX;
      if (endX == null) return;

      const delta = endX - touchStartXRef.current;
      touchStartXRef.current = null;

      if (delta > SWIPE_THRESHOLD_PX) {
        goPrev();
      } else if (delta < -SWIPE_THRESHOLD_PX) {
        goNext();
      }
    },
    [goNext, goPrev, hasMultiple],
  );

  const activeSrc = images[activeIndex];
  if (!activeSrc) return null;

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-lightbox flex flex-col bg-charcoal/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={onClose}
    >
      <div
        className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 text-white sm:px-6"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm tabular-nums backdrop-blur-sm">
          {activeIndex + 1} / {images.length}
        </span>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div
        className="relative min-h-0 flex-1 touch-pan-y"
        onClick={(event) => event.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {hasMultiple ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Предыдущее фото"
              className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 md:left-6"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Следующее фото"
              className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 md:right-6"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        ) : null}

        <SafeImage
          src={buildSupabaseCdnUrl(activeSrc, { width: 2200, quality: 84 })}
          alt={`${title} — ${activeIndex + 1}`}
          fill
          className="object-contain p-4 md:p-8"
          sizes="100vw"
          priority
          placeholderVariant="tour"
          blurPlaceholder={false}
        />
      </div>

      {hasMultiple ? (
        <div
          className="shrink-0 px-4 pb-4 pt-2 sm:px-6"
          onClick={(event) => event.stopPropagation()}
        >
          <div
            className="flex justify-center gap-2 overflow-x-auto pb-1 scrollbar-hide"
            role="tablist"
            aria-label="Миниатюры галереи"
          >
            {images.map((src, index) => (
              <button
                key={`${src}-lightbox-thumb-${index}`}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`Фото ${index + 1} из ${images.length}`}
                onClick={() => onActiveIndexChange(index)}
                className={cn(
                  "relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-charcoal/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:h-16 sm:w-24",
                  index === activeIndex
                    ? "ring-2 ring-white shadow-sm"
                    : "opacity-70 ring-1 ring-white/20 hover:opacity-100",
                )}
              >
                <SafeImage
                  src={buildSupabaseCdnUrl(src, { width: 320, quality: 72 })}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="96px"
                  loading="lazy"
                  placeholderVariant="tour"
                  blurPlaceholder={false}
                />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
