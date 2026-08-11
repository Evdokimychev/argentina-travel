"use client";

import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { scrollToSiteAnchor } from "@/lib/scroll-anchor";
import { hubTocStickyMaxHeightClass, hubTocStickyTopClass } from "@/lib/site-container";
import { useContentTocScrollSpy } from "@/hooks/useContentTocScrollSpy";
import type { ContentTocItem } from "@/types/content-reading";

type TableOfContentsProps = {
  items: ContentTocItem[];
  variant: "sidebar" | "mobile";
  className?: string;
  embedded?: boolean;
  /** Без обёртки nav — только список (внутри CollapsibleAsidePanel) */
  bare?: boolean;
};

function handleAnchorClick(id: string) {
  return (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    scrollToSiteAnchor(id);
  };
}

function TocList({
  items,
  activeId,
}: {
  items: ContentTocItem[];
  activeId?: string | null;
}) {
  return (
    <ol className="mt-2 space-y-0.5 text-sm">
      {items.map((item) => {
        const active = activeId === item.id;
        return (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={handleAnchorClick(item.id)}
              aria-current={active ? "location" : undefined}
              className={cn(
                "flex items-center rounded-lg px-2.5 py-1.5 leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 focus-visible:ring-offset-2",
                item.level === 3 ? "pl-4 text-[13px]" : "font-medium",
                active ? "bg-sky/10 text-sky" : "text-slate hover:bg-gray-50 hover:text-charcoal",
              )}
            >
              {item.label}
            </a>
          </li>
        );
      })}
    </ol>
  );
}

function TocSidebar({
  items,
  className,
  embedded = false,
  bare = false,
}: {
  items: ContentTocItem[];
  className?: string;
  embedded?: boolean;
  bare?: boolean;
}) {
  const activeId = useContentTocScrollSpy(items);

  if (bare) {
    return (
      <nav className={className} aria-label="Содержание">
        <TocList items={items} activeId={activeId} />
      </nav>
    );
  }

  return (
    <nav
      className={cn(
        "rounded-2xl border border-gray-100 bg-white p-4 shadow-card",
        !embedded && hubTocStickyTopClass,
        !embedded && hubTocStickyMaxHeightClass,
        className,
      )}
      aria-label="Содержание"
    >
      <p className="font-heading text-sm font-bold leading-none text-charcoal">Содержание</p>
      <TocList items={items} activeId={activeId} />
    </nav>
  );
}

function scrollActiveChipIntoView(
  container: HTMLElement | null,
  activeId: string | null,
  behavior: ScrollBehavior = "smooth",
) {
  if (!container || !activeId) return;
  const link = container.querySelector<HTMLAnchorElement>(`[data-toc-id="${activeId}"]`);
  if (!link) return;

  const containerRect = container.getBoundingClientRect();
  const linkRect = link.getBoundingClientRect();
  const fullyVisible =
    linkRect.left >= containerRect.left - 2 && linkRect.right <= containerRect.right + 2;

  if (!fullyVisible) {
    link.scrollIntoView({ behavior, block: "nearest", inline: "center" });
  }
}

function tocChipClass(active: boolean, level?: number) {
  return cn(
    "blog-touch-target inline-flex items-center rounded-full border px-2.5 text-xs leading-snug whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 focus-visible:ring-offset-2",
    level === 3 && "font-normal",
    active
      ? "border-sky/40 bg-sky/10 font-medium text-sky"
      : "border-gray-200 bg-surface-muted/60 text-charcoal hover:border-sky/40 hover:text-sky",
  );
}

function TocMobile({ items, className }: { items: ContentTocItem[]; className?: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const [expanded, setExpanded] = useState(false);
  const activeId = useContentTocScrollSpy(items);

  useEffect(() => {
    if (expanded) return;
    scrollActiveChipIntoView(trackRef.current, activeId);
  }, [activeId, expanded]);

  const goToSection = (id: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    handleAnchorClick(id)(event);
    setExpanded(false);
  };

  return (
    <nav
      className={cn(
        "sticky z-20 rounded-2xl border border-gray-100 bg-white/95 py-1.5 pl-2 pr-1.5 shadow-card backdrop-blur-sm lg:hidden",
        hubTocStickyTopClass,
        className,
      )}
      aria-label="Содержание"
    >
      <div className="flex min-w-0 items-center gap-1">
        <div
          ref={trackRef}
          className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <ul className="flex w-max items-center gap-1.5">
            <li className="shrink-0">
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setExpanded((open) => !open)}
                className="blog-touch-target inline-flex items-center gap-1 rounded-full px-1.5 font-heading text-xs font-bold leading-none text-charcoal transition-colors hover:text-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
              >
                Содержание
              </button>
            </li>
            {items.map((item) => {
              const active = activeId === item.id;
              return (
                <li key={item.id} className="shrink-0">
                  <a
                    href={`#${item.id}`}
                    data-toc-id={item.id}
                    onClick={goToSection(item.id)}
                    aria-current={active ? "location" : undefined}
                    className={tocChipClass(active, item.level)}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded((open) => !open)}
          className="blog-touch-target inline-flex shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white px-2 text-slate transition-colors hover:border-sky/30 hover:text-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
        >
          <span className="sr-only">{expanded ? "Свернуть список" : "Показать весь список"}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200 motion-reduce:transition-none",
              expanded && "rotate-180",
            )}
            aria-hidden
          />
        </button>
      </div>

      {expanded ? (
        <div
          id={panelId}
          className="mt-1.5 max-h-44 overflow-y-auto overscroll-contain border-t border-gray-100 pt-2"
        >
          <ul className="flex flex-wrap gap-1.5 pb-0.5">
            {items.map((item) => {
              const active = activeId === item.id;
              return (
                <li key={`panel-${item.id}`}>
                  <a
                    href={`#${item.id}`}
                    onClick={goToSection(item.id)}
                    aria-current={active ? "location" : undefined}
                    className={tocChipClass(active, item.level)}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </nav>
  );
}

export default function TableOfContents({
  items,
  variant,
  className,
  embedded,
  bare,
}: TableOfContentsProps) {
  if (items.length < 2) return null;

  if (variant === "mobile") {
    return <TocMobile items={items} className={className} />;
  }

  return <TocSidebar items={items} className={className} embedded={embedded} bare={bare} />;
}
