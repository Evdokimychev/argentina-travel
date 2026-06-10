"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { TourSectionLink } from "./tour-section-links";

interface TourSectionNavProps {
  items: TourSectionLink[];
}

function readCssPx(name: string, fallback: number): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const value = parseFloat(raw);
  return Number.isFinite(value) ? value : fallback;
}

function getScrollAnchorOffset(navHeight: number): number {
  return readCssPx("--site-header-height", 72) + navHeight + 12;
}

export default function TourSectionNav({ items }: TourSectionNavProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const navRef = useRef<HTMLElement>(null);
  const navHeightRef = useRef(0);
  const isClickScrollingRef = useRef(false);

  const syncNavHeight = useCallback(() => {
    const height = navRef.current?.offsetHeight ?? 0;
    navHeightRef.current = height;
    if (height > 0) {
      document.documentElement.style.setProperty("--tour-section-nav-height", `${height}px`);
    }
  }, []);

  const scrollToSection = useCallback((id: string) => {
    const target = document.getElementById(id);
    if (!target) return;

    isClickScrollingRef.current = true;
    const offset = getScrollAnchorOffset(navHeightRef.current);
    const top = target.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({ top, behavior: "smooth" });
    setActiveId(id);

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

    let frame = 0;

    const updateActiveSection = () => {
      frame = 0;
      if (isClickScrollingRef.current) return;

      const offset = getScrollAnchorOffset(navHeightRef.current);
      let nextActiveId = items[0].id;

      for (const item of items) {
        const section = document.getElementById(item.id);
        if (!section) continue;

        if (section.getBoundingClientRect().top <= offset) {
          nextActiveId = item.id;
        }
      }

      setActiveId((current) => (current === nextActiveId ? current : nextActiveId));
    };

    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateActiveSection);
    };

    updateActiveSection();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [items]);

  useEffect(() => {
    const activeLink = navRef.current?.querySelector<HTMLAnchorElement>(
      `[data-section-id="${activeId}"]`
    );
    activeLink?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeId]);

  if (!items.length) return null;

  return (
    <nav
      ref={navRef}
      aria-label="Разделы страницы тура"
      className={cn(
        "sticky z-40 -mx-4 border-b border-gray-200/80 bg-pampas/95 px-4 py-2.5 backdrop-blur-md",
        "top-[calc(var(--site-header-height,72px)+0.5rem)]",
        "sm:-mx-0 sm:rounded-xl sm:border sm:px-3 sm:shadow-sm"
      )}
    >
      <ul className="scrollbar-hide flex gap-1 overflow-x-auto">
        {items.map((item) => {
          const active = item.id === activeId;
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
                  "inline-flex rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "bg-sky text-white shadow-sm"
                    : "text-slate hover:bg-white hover:text-charcoal"
                )}
                aria-current={active ? "location" : undefined}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
