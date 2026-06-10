"use client";

import { useEffect, type RefObject } from "react";

export function useSyncSiteSectionNavHeight(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const syncHeight = () => {
      document.documentElement.style.setProperty(
        "--site-section-nav-height",
        `${element.offsetHeight}px`
      );
    };

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(element);
    window.addEventListener("resize", syncHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncHeight);
      document.documentElement.style.removeProperty("--site-section-nav-height");
    };
  }, [ref]);
}
