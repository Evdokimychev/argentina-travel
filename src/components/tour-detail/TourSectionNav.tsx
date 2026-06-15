"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { getSiteScrollAnchorOffset, scrollToSiteAnchor } from "@/lib/scroll-anchor";
import { getTourSectionIcon } from "@/lib/tour-nav-icons";
import { siteContainerClass } from "@/lib/site-container";
import type { TourSectionLink } from "./tour-section-links";

interface TourSectionNavProps {
  items: TourSectionLink[];
}

function scrollNavLinkIntoView(
  container: HTMLElement | null,
  sectionId: string,
  behavior: ScrollBehavior = "instant"
) {
  const link = container?.querySelector<HTMLAnchorElement>(`[data-section-id="${sectionId}"]`);
  if (!link || !container) return;

  const containerRect = container.getBoundingClientRect();
  const linkRect = link.getBoundingClientRect();
  const fullyVisible =
    linkRect.left >= containerRect.left - 2 && linkRect.right <= containerRect.right + 2;

  if (!fullyVisible) {
    link.scrollIntoView({ behavior, block: "nearest", inline: "center" });
  }
}

export default function TourSectionNav({ items }: TourSectionNavProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const navRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const isClickScrollingRef = useRef(false);

  const refreshOffset = useCallback(() => {
    offsetRef.current = getSiteScrollAnchorOffset();
  }, []);

  const syncNavHeight = useCallback(() => {
    const height = navRef.current?.offsetHeight ?? 0;
    if (height > 0) {
      document.documentElement.style.setProperty("--tour-section-nav-height", `${height}px`);
    }
    refreshOffset();
  }, [refreshOffset]);

  const scrollToSection = useCallback((id: string) => {
    if (!document.getElementById(id)) return;

    isClickScrollingRef.current = true;
    scrollToSiteAnchor(id);
    setActiveId(id);
    requestAnimationFrame(() => {
      scrollNavLinkIntoView(scrollContainerRef.current, id, "smooth");
    });

    window.setTimeout(() => {
      isClickScrollingRef.current = false;
    }, 700);
  }, []);

  useEffect(() => {
    syncNavHeight();
    const nav = navRef.current;
    if (!nav) return;

    const observer = new ResizeObserver(syncNavHeight);
    observer.observe(nav);

    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--tour-section-nav-height");
    };
  }, [syncNavHeight]);

  useEffect(() => {
    if (!items.length) return;

    refreshOffset();

    const sectionElements = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element != null);

    if (!sectionElements.length) return;

    let observer: IntersectionObserver | null = null;

    const pickActiveSection = () => {
      if (isClickScrollingRef.current) return;

      const offset = offsetRef.current;
      let nextActiveId = items[0].id;

      for (const item of items) {
        const section = document.getElementById(item.id);
        if (!section) continue;
        if (section.getBoundingClientRect().top <= offset + 2) {
          nextActiveId = item.id;
        }
      }

      setActiveId((current) => (current === nextActiveId ? current : nextActiveId));
    };

    const connectObserver = () => {
      observer?.disconnect();
      refreshOffset();

      observer = new IntersectionObserver(() => pickActiveSection(), {
        root: null,
        rootMargin: `-${offsetRef.current}px 0px -55% 0px`,
        threshold: 0,
      });

      sectionElements.forEach((section) => observer!.observe(section));
      pickActiveSection();
    };

    connectObserver();

    const onLayoutChange = () => {
      refreshOffset();
      connectObserver();
    };

    window.addEventListener("resize", onLayoutChange);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", onLayoutChange);
    };
  }, [items, refreshOffset]);

  if (!items.length) return null;

  return (
    <nav
      ref={navRef}
      aria-label="Разделы страницы тура"
      className="sticky top-[var(--site-header-height,72px)] z-40 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md"
    >
      <div
        ref={scrollContainerRef}
        className={cn(siteContainerClass, "overflow-x-auto overscroll-x-contain py-3")}
      >
        <ul className="flex min-w-max gap-1.5">
          {items.map((item) => {
            const active = item.id === activeId;
            const Icon = getTourSectionIcon(item.id);
            return (
              <li key={item.id} className="shrink-0">
                <a
                  href={`#${item.id}`}
                  data-section-id={item.id}
                  onClick={(event) => {
                    event.preventDefault();
                    scrollToSection(item.id);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                    active
                      ? "border-sky bg-sky text-white shadow-sm"
                      : "border-gray-200 bg-white text-foreground/80 hover:border-sky/30 hover:bg-sky/5 hover:text-sky"
                  )}
                  aria-current={active ? "location" : undefined}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
