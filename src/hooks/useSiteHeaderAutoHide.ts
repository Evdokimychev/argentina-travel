"use client";

import { useEffect, useRef, useState } from "react";

const SCROLL_DELTA_PX = 18;
const MIN_SCROLL_Y_TO_HIDE_PX = 96;
const TOP_REVEAL_Y_PX = 48;
const TOGGLE_COOLDOWN_MS = 280;

type UseSiteHeaderAutoHideOptions = {
  headerRef: React.RefObject<HTMLElement | null>;
  disabled?: boolean;
};

export type SiteHeaderChromeState = {
  headerVisible: boolean;
};

type ApplyHeaderOffsetOptions = {
  compensateScroll?: boolean;
};

function applyHeaderOffset(
  fullHeightPx: number,
  visible: boolean,
  options?: ApplyHeaderOffsetOptions
) {
  const root = document.documentElement;
  const fullNum = Math.max(0, Math.round(fullHeightPx));
  const full = `${fullNum}px`;
  const wasVisible = root.dataset.siteHeader !== "hidden";

  root.style.setProperty("--site-header-full-height", full);

  if (
    options?.compensateScroll &&
    wasVisible !== visible &&
    fullNum > 0 &&
    typeof window !== "undefined"
  ) {
    const currentY = window.scrollY;
    const nextY = visible
      ? currentY + fullNum
      : Math.max(0, currentY - fullNum);
    window.scrollTo({ top: nextY, left: 0, behavior: "instant" });
  }

  root.style.setProperty("--site-header-height", visible ? full : "0px");
  root.dataset.siteHeader = visible ? "visible" : "hidden";

  return window.scrollY;
}

export function useSiteHeaderAutoHide({
  headerRef,
  disabled = false,
}: UseSiteHeaderAutoHideOptions): SiteHeaderChromeState {
  const [visible, setVisible] = useState(true);
  const visibleRef = useRef(true);
  const lastScrollYRef = useRef(0);
  const lastToggleAtRef = useRef(0);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    if (disabled) {
      setVisible(true);
    }
  }, [disabled]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const syncFullHeight = () => {
      applyHeaderOffset(header.offsetHeight, visibleRef.current || disabled);
    };

    syncFullHeight();

    const observer = new ResizeObserver(syncFullHeight);
    observer.observe(header);
    window.addEventListener("resize", syncFullHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncFullHeight);
    };
  }, [disabled, headerRef]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const nextVisible = visible || disabled;
    const nextScrollY = applyHeaderOffset(header.offsetHeight, nextVisible, {
      compensateScroll: !disabled,
    });
    lastScrollYRef.current = nextScrollY;
  }, [disabled, headerRef, visible]);

  useEffect(() => {
    if (disabled) return;

    lastScrollYRef.current = window.scrollY;
    let ticking = false;

    const setVisibleWithCooldown = (next: boolean) => {
      if (next === visibleRef.current) return;
      const now = Date.now();
      if (now - lastToggleAtRef.current < TOGGLE_COOLDOWN_MS) return;
      lastToggleAtRef.current = now;
      setVisible(next);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        ticking = false;

        const currentY = window.scrollY;
        const delta = currentY - lastScrollYRef.current;

        if (currentY <= TOP_REVEAL_Y_PX) {
          setVisibleWithCooldown(true);
        } else if (currentY >= MIN_SCROLL_Y_TO_HIDE_PX && delta > SCROLL_DELTA_PX) {
          setVisibleWithCooldown(false);
        } else if (delta < -SCROLL_DELTA_PX) {
          setVisibleWithCooldown(true);
        }

        lastScrollYRef.current = currentY;
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

  return { headerVisible: visible };
}
