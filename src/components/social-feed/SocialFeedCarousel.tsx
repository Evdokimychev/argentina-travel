"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SocialFeedTile } from "@/components/social-feed/SocialFeedTile";
import { cn } from "@/lib/cn";
import { tokenFocusRingClass } from "@/lib/design-tokens";
import type { SocialFeedItem, SocialFeedSource } from "@/lib/social-feed/types";

type SocialFeedCarouselProps = {
  items: SocialFeedItem[];
  sourcesById: Map<string, SocialFeedSource>;
  className?: string;
};

export default function SocialFeedCarousel({
  items,
  sourcesById,
  className,
}: SocialFeedCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollByDir(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.85, 420), behavior: "smooth" });
  }

  return (
    <div className={cn("relative", className)}>
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-roledescription="carousel"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="w-[min(72vw,280px)] shrink-0 snap-start sm:w-[240px] lg:w-[260px]"
          >
            <SocialFeedTile
              item={item}
              source={sourcesById.get(item.sourceId)}
            />
          </div>
        ))}
      </div>

      {items.length > 3 ? (
        <>
          <button
            type="button"
            onClick={() => scrollByDir(-1)}
            className={cn(
              "absolute -left-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-charcoal shadow-md ring-1 ring-charcoal/10 transition hover:bg-white sm:flex",
              tokenFocusRingClass
            )}
            aria-label="Предыдущие публикации"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollByDir(1)}
            className={cn(
              "absolute -right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-charcoal shadow-md ring-1 ring-charcoal/10 transition hover:bg-white sm:flex",
              tokenFocusRingClass
            )}
            aria-label="Следующие публикации"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      ) : null}
    </div>
  );
}
