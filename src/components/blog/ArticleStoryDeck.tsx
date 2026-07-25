"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Flame,
  Receipt,
  Scale,
  UtensilsCrossed,
  Users,
  type LucideIcon,
} from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import TravelWidgetRenderer from "@/components/travel/TravelWidgetRenderer";
import { cn } from "@/lib/cn";
import { mediaUrl } from "@/lib/media/media-cdn";
import type { StoryDeckSlide } from "@/types/blog-content-blocks";

const DECK_ICONS: Record<string, LucideIcon> = {
  BookOpen,
  UtensilsCrossed,
  Flame,
  Scale,
  Users,
  Receipt,
  ClipboardList,
};

const SWIPE_THRESHOLD_PX = 40;

type ArticleStoryDeckProps = {
  title: string;
  ariaLabel: string;
  slides: StoryDeckSlide[];
  className?: string;
};

/**
 * Reusable 7-ish slide HTML "story deck" for long guides.
 *
 * Progressive enhancement: every slide is always in the DOM as a normal
 * stacked section (readable with CSS/JS disabled). Once mounted, JS switches
 * the track to a CSS-grid stack (stable height) and shows one slide at a
 * time with Back/Next, dot indicators, swipe and arrow-key navigation.
 * No autoplay — the reader always drives navigation.
 */
export default function ArticleStoryDeck({
  title,
  ariaLabel,
  slides,
  className,
}: ArticleStoryDeckProps) {
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const total = slides.length;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (total === 0) return null;

  const goTo = (index: number) => {
    setActiveIndex(((index % total) + total) % total);
  };
  const goPrev = () => goTo(activeIndex - 1);
  const goNext = () => goTo(activeIndex + 1);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!mounted) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };
  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current == null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (!mounted || Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    if (delta < 0) goNext();
    else goPrev();
  };

  const activeSlide = slides[activeIndex];

  return (
    <section
      className={cn(
        // Hairline border only — this is the one card-like surface for the
        // whole deck; nothing shadowed nests inside it (widget slides render
        // flat, without their own boxed wrapper).
        "rounded-[1.75rem] border border-gray-100 bg-white",
        className,
      )}
      aria-roledescription="carousel"
      aria-label={ariaLabel}
    >
      <div className="border-b border-gray-100 px-4 py-4 sm:px-6 sm:py-5">
        <h3 className="font-heading text-lg font-bold text-charcoal sm:text-xl">{title}</h3>
        {mounted ? (
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate">
            <span aria-hidden>{`${activeIndex + 1} / ${total}`}</span>
            <span className="sr-only" aria-live="polite">
              {`Слайд ${activeIndex + 1} из ${total}: ${activeSlide.title}`}
            </span>
          </p>
        ) : null}
      </div>

      <div
        className="px-4 py-5 sm:px-6 sm:py-6"
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className={cn(mounted && "grid")}>
          {slides.map((slide, index) => {
            const isActive = index === activeIndex;
            const Icon = DECK_ICONS[slide.icon] ?? BookOpen;
            return (
              <article
                key={slide.id}
                className={cn(
                  "flex flex-col gap-5",
                  !slide.widgetKey && "sm:flex-row sm:items-center",
                  mounted
                    ? cn(
                        "[grid-area:1/1] transition-opacity duration-200 motion-reduce:transition-none",
                        isActive
                          ? "visible relative z-10 opacity-100"
                          : "invisible pointer-events-none opacity-0",
                      )
                    : "mt-6 border-t border-gray-100 pt-6 first:mt-0 first:border-t-0 first:pt-0",
                )}
              >
                <div className="order-2 min-w-0 flex-1 sm:order-1">
                  <h4 className="font-heading text-base font-semibold text-charcoal sm:text-lg">
                    {slide.title}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-slate sm:text-[0.9375rem]">
                    {slide.body}
                  </p>
                  {slide.bullets?.length ? (
                    <ul className="mt-3 space-y-1.5">
                      {slide.bullets.map((item) => (
                        <li key={item} className="flex gap-2 text-sm leading-relaxed text-slate">
                          <span
                            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky"
                            aria-hidden
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {slide.ctas?.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {slide.ctas.map((cta) => (
                        <Link
                          key={cta.href}
                          href={cta.href}
                          className="inline-flex min-h-11 items-center rounded-full border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-charcoal transition hover:border-sky/40 hover:text-sky"
                        >
                          {cta.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                  {slide.widgetKey ? (
                    <div className="mt-4">
                      <TravelWidgetRenderer widgetKey={slide.widgetKey} />
                    </div>
                  ) : null}
                </div>
                {!slide.widgetKey && slide.image ? (
                  <figure className="order-1 w-full shrink-0 sm:order-2 sm:w-64">
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl sm:aspect-[4/3]">
                      <SafeImage
                        src={mediaUrl(slide.image.src)}
                        alt={slide.image.alt}
                        fill
                        sizes="(min-width: 640px) 256px, 100vw"
                        className="object-cover"
                        placeholderVariant="generic"
                      />
                    </div>
                    {slide.image.caption ? (
                      <figcaption className="mt-1.5 text-[0.7rem] leading-snug text-slate/80">
                        {slide.image.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                ) : !slide.widgetKey ? (
                  <div
                    className="order-1 flex h-16 w-16 shrink-0 items-center justify-center self-start rounded-2xl bg-sky/[0.08] text-sky sm:order-2 sm:h-20 sm:w-20"
                    aria-hidden
                  >
                    <Icon className="h-8 w-8 sm:h-9 sm:w-9" />
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>

      {mounted ? (
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Предыдущая карточка"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-charcoal transition hover:border-sky/40 hover:text-sky"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>

          <div className="flex flex-wrap items-center justify-center gap-1.5" role="tablist">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-current={index === activeIndex ? "true" : undefined}
                aria-label={`Карточка ${index + 1}: ${slide.title}`}
                onClick={() => goTo(index)}
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition",
                  index === activeIndex ? "bg-sky" : "bg-gray-200 hover:bg-gray-300",
                )}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={goNext}
            aria-label="Следующая карточка"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-charcoal transition hover:border-sky/40 hover:text-sky"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      ) : null}
    </section>
  );
}
