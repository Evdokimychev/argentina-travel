"use client";

import { useEffect, useState } from "react";
import type { ContentTocItem } from "@/types/content-reading";

const SCROLL_SPY_ROOT_MARGIN = "-20% 0px -55% 0px";
const SCROLL_SPY_THRESHOLDS: number[] = [0, 0.25, 0.5];

export function useContentTocScrollSpy(items: ContentTocItem[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: SCROLL_SPY_ROOT_MARGIN, threshold: SCROLL_SPY_THRESHOLDS }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  return activeId;
}
