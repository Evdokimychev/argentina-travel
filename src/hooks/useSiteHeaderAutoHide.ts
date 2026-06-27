"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  applySiteHeaderChrome,
  SITE_HEADER_HIDE_DISTANCE_PX,
  SITE_HEADER_MIN_HIDE_SCROLL_PX,
  SITE_HEADER_REVEAL_DISTANCE_PX,
  SITE_HEADER_TOP_REVEAL_PX,
} from "@/lib/site-header-chrome";

type UseSiteHeaderAutoHideOptions = {
  headerRef: React.RefObject<HTMLElement | null>;
  disabled?: boolean;
  /** Force header hidden (e.g. modal overlay open). */
  forceHidden?: boolean;
};

export type SiteHeaderChromeState = {
  headerVisible: boolean;
};

export function useSiteHeaderAutoHide({
  headerRef,
  disabled = false,
  forceHidden = false,
}: UseSiteHeaderAutoHideOptions): SiteHeaderChromeState {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const visibleRef = useRef(true);
  const lastScrollYRef = useRef(0);
  const downAccumRef = useRef(0);
  const upAccumRef = useRef(0);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    if (disabled) {
      setVisible(true);
    }
  }, [disabled]);

  // Reset to visible on route change before paint (avoids a hidden flash on nav).
  useLayoutEffect(() => {
    setVisible(true);
    downAccumRef.current = 0;
    upAccumRef.current = 0;

    const header = headerRef.current;
    if (header) {
      lastScrollYRef.current = applySiteHeaderChrome(header.offsetHeight, true);
    } else {
      document.documentElement.dataset.siteHeader = "visible";
      lastScrollYRef.current = typeof window !== "undefined" ? window.scrollY : 0;
    }
  }, [pathname, headerRef]);

  // Keep the measured full height in sync with the real header element.
  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    let lastMeasuredHeight = 0;

    const syncFullHeight = () => {
      const nextHeight = header.offsetHeight;
      if (
        lastMeasuredHeight > 0 &&
        Math.abs(nextHeight - lastMeasuredHeight) < 4
      ) {
        return;
      }
      lastMeasuredHeight = nextHeight;
      applySiteHeaderChrome(
        nextHeight,
        (visibleRef.current || disabled) && !forceHidden,
      );
    };

    syncFullHeight();

    const observer = new ResizeObserver(syncFullHeight);
    observer.observe(header);
    window.addEventListener("resize", syncFullHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncFullHeight);
    };
  }, [disabled, forceHidden, headerRef]);

  // Reflect the visible state into CSS vars / data attribute.
  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const nextVisible = (visible || disabled) && !forceHidden;
    lastScrollYRef.current = applySiteHeaderChrome(header.offsetHeight, nextVisible);
  }, [disabled, forceHidden, headerRef, visible]);

  // Distance-based auto-hide: hide after sustained downward scroll, reveal on the
  // slightest upward scroll. Predictable and free of timer/flicker artefacts.
  useEffect(() => {
    if (disabled) return;

    lastScrollYRef.current = window.scrollY;
    downAccumRef.current = 0;
    upAccumRef.current = 0;
    let ticking = false;

    const reveal = () => {
      if (!visibleRef.current) setVisible(true);
    };
    const hide = () => {
      if (visibleRef.current) setVisible(false);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        ticking = false;

        const currentY = Math.max(0, window.scrollY);
        const delta = currentY - lastScrollYRef.current;
        lastScrollYRef.current = currentY;

        if (currentY <= SITE_HEADER_TOP_REVEAL_PX) {
          downAccumRef.current = 0;
          upAccumRef.current = 0;
          reveal();
          return;
        }

        if (delta > 0) {
          downAccumRef.current += delta;
          upAccumRef.current = 0;
          if (
            currentY >= SITE_HEADER_MIN_HIDE_SCROLL_PX &&
            downAccumRef.current >= SITE_HEADER_HIDE_DISTANCE_PX
          ) {
            downAccumRef.current = 0;
            hide();
          }
        } else if (delta < 0) {
          upAccumRef.current += -delta;
          downAccumRef.current = 0;
          if (upAccumRef.current >= SITE_HEADER_REVEAL_DISTANCE_PX) {
            upAccumRef.current = 0;
            reveal();
          }
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [disabled]);

  useEffect(() => {
    return () => {
      const root = document.documentElement;
      root.style.removeProperty("--site-header-full-height");
      root.style.removeProperty("--site-header-height");
      delete root.dataset.siteHeader;
    };
  }, []);

  return { headerVisible: visible && !forceHidden };
}
